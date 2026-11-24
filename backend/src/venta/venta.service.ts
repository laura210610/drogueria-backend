import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import { UpdateVentaDto } from './dto/update-venta.dto';

@Injectable()
export class VentaService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.venta.findMany({
      include: {
        detalles: true,
      },
    });
  }

  async findOne(id: number) {
    const venta = await this.prisma.venta.findUnique({
      where: { id },
      include: {
        detalles: true,
      },
    });

    if (!venta) {
      throw new NotFoundException('Venta no encontrada');
    }

    return venta;
  }

  // Fase 3 (T8): la venta completa corre en UNA sola transacción.
  // - Valida stock de cada medicamento (409 si alcanza).
  // - Recalcula precio (precioVenta) y total (cantidad x precio) por línea:
  //   lo que manda el cliente en esos campos se ignora.
  // - El total de la cabecera es la suma de las líneas.
  // - Descuenta stock y recalcula el estado de cada medicamento.
  // - usuarioId siempre viene del token, nunca del body.
  async create(datos: CreateVentaDto, usuarioId: number) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // 1. Validar y recalcular TODAS las líneas antes de escribir nada:
        //    si algo falla, la transacción aborta sin efectos.
        const lineas: {
          medicamentoId: string;
          cantidad: number;
          precio: number;
          total: number;
          stockActual: number;
        }[] = [];

        for (const detalle of datos.detalles) {
          const medicamento = await tx.medicamento.findUnique({
            where: { id: detalle.medicamentoId },
          });

          if (!medicamento) {
            throw new NotFoundException(
              `El medicamento "${detalle.medicamentoId}" no existe en el inventario`,
            );
          }

          if (medicamento.stock < detalle.cantidad) {
            throw new ConflictException(
              `Stock insuficiente para "${medicamento.nombre}": disponibles ${medicamento.stock}, solicitados ${detalle.cantidad}`,
            );
          }

          const precio = medicamento.precioVenta; // el precio del body se ignora
          lineas.push({
            medicamentoId: medicamento.id,
            cantidad: detalle.cantidad,
            precio,
            total: detalle.cantidad * precio, // el total del body se ignora
            stockActual: medicamento.stock,
          });
        }

        // 2. Cabecera: el total del body se ignora, es la suma de las líneas.
        const total = lineas.reduce((suma, linea) => suma + linea.total, 0);

        const venta = await tx.venta.create({
          data: {
            cliente: datos.cliente,
            factura: datos.factura,
            fecha: new Date(datos.fecha),
            total,
            usuarioId, // del token JWT, nunca del body
            detalles: {
              create: lineas.map((linea) => ({
                cantidad: linea.cantidad,
                precio: linea.precio,
                total: linea.total,
                medicamento: {
                  connect: { id: linea.medicamentoId },
                },
              })),
            },
          },
          include: {
            detalles: true,
          },
        });

        // 3. Descontar stock y recalcular el estado de cada medicamento.
        for (const linea of lineas) {
          const nuevoStock = linea.stockActual - linea.cantidad;

          await tx.medicamento.update({
            where: { id: linea.medicamentoId },
            data: {
              stock: nuevoStock,
              estado: derivarEstado(nuevoStock),
            },
          });
        }

        return venta;
      });
    } catch (error) {
      // La factura es única en la base: la duplicada se reporta como 409.
      if (esErrorUnicoDuplicado(error)) {
        throw new ConflictException('El número de factura ya existe');
      }

      // Los errores de negocio (409 stock, 404 medicamento) suben tal cual.
      throw error;
    }
  }

  // Fase 3 (T8): solo se puede modificar cliente y fecha. Total y detalles
  // se calculan al registrar la venta; tocarlos por fuera descuadraría la
  // venta y el inventario, por eso se rechazan con 400.
  async update(id: number, datos: UpdateVentaDto) {
    const camposNoPermitidos = (
      ['factura', 'total', 'detalles', 'usuarioId'] as const
    ).filter((campo) => datos[campo] !== undefined);

    if (camposNoPermitidos.length > 0) {
      throw new BadRequestException(
        `Solo se puede modificar cliente y fecha de la venta. Campos no permitidos: ${camposNoPermitidos.join(', ')}. Para corregir el total o los detalles, elimine la venta y regístrela de nuevo (el stock se repone).`,
      );
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        return tx.venta.update({
          where: { id },
          data: {
            ...(datos.cliente !== undefined ? { cliente: datos.cliente } : {}),
            ...(datos.fecha !== undefined
              ? { fecha: new Date(datos.fecha) }
              : {}),
          },
        });
      });
    } catch (error) {
      if (codigoPrisma(error) === 'P2025') {
        throw new NotFoundException('Venta no encontrada');
      }

      throw error;
    }
  }

  // Fase 3 (T8): borrar una venta repone el stock de cada detalle y
  // recalcula el estado, todo en la misma transacción del borrado.
  async remove(id: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const venta = await tx.venta.findUnique({
        where: { id },
        include: { detalles: true },
      });

      if (!venta) {
        throw new NotFoundException('Venta no encontrada');
      }

      for (const detalle of venta.detalles) {
        const medicamento = await tx.medicamento.findUnique({
          where: { id: detalle.medicamentoId },
        });

        if (!medicamento) {
          // No debería ocurrir (hay FK), pero no se enmascara.
          throw new NotFoundException(
            `El medicamento "${detalle.medicamentoId}" no existe en el inventario`,
          );
        }

        const nuevoStock = medicamento.stock + detalle.cantidad;

        await tx.medicamento.update({
          where: { id: detalle.medicamentoId },
          data: {
            stock: nuevoStock,
            estado: derivarEstado(nuevoStock),
          },
        });
      }

      await tx.venta.delete({ where: { id } });
    });
  }
}

// Deriva el estado visible del medicamento a partir del stock.
// NOTA: replicado de medicamento.service.ts (no está exportado allí y esta
// tarea no permite tocar ese módulo). Misma regla: 0 -> 'Sin stock',
// < 20 -> 'Bajo stock', resto -> 'Activo'.
function derivarEstado(stock: number): string {
  if (stock <= 0) return 'Sin stock';
  if (stock < 20) return 'Bajo stock';
  return 'Activo';
}

// Detecta la violación de unique de Prisma (número de factura repetido).
function esErrorUnicoDuplicado(error: unknown): boolean {
  return codigoPrisma(error) === 'P2002';
}

// Devuelve el código de la librería Prisma si el error lo trae.
function codigoPrisma(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return (error as { code?: string }).code;
  }
  return undefined;
}
