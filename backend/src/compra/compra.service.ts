import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateCompraDto } from './dto/create-compra.dto';
import { UpdateCompraDto } from './dto/update-compra.dto';

@Injectable()
export class CompraService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return await this.prisma.compra.findMany({
      include: {
        detalles: true,
      },
    });
  }

  async findOne(id: number) {
    const compra = await this.prisma.compra.findUnique({
      where: { id },
      include: {
        detalles: true,
      },
    });

    if (!compra) {
      throw new NotFoundException('Compra no encontrada');
    }

    return compra;
  }

  // Fase 4 (T9): la compra completa corre en UNA sola transacción.
  // - Valida que cada medicamento exista (404 con el id si no).
  // - Incrementa el stock de cada medicamento y recalcula su estado.
  // - Actualiza precioCompra y precioVenta del medicamento con los valores
  //   del detalle: la compra fija los precios nuevos del catálogo.
  // - El total de cada línea es cantidad x precioCompra y el total de la
  //   cabecera es la suma de las líneas: lo que manda el cliente se ignora.
  async create(datos: CreateCompraDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // 1. Validar y recalcular TODAS las líneas antes de escribir nada:
        //    si algo falla, la transacción aborta sin efectos.
        const lineas: {
          medicamentoId: string;
          cantidad: number;
          precioCompra: number;
          precioVenta: number;
          total: number;
          stockActual: number;
          fechaVencimiento: Date | null;
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

          const precioCompra = detalle.precioCompra; // precio nuevo del catálogo
          lineas.push({
            medicamentoId: medicamento.id,
            cantidad: detalle.cantidad,
            precioCompra,
            precioVenta: detalle.precioVenta,
            total: detalle.cantidad * precioCompra, // el total del body se ignora
            stockActual: medicamento.stock,
            fechaVencimiento: detalle.fechaVencimiento
              ? new Date(detalle.fechaVencimiento)
              : null,
          });
        }

        // 2. Cabecera: el total del body se ignora, es la suma de las líneas.
        const total = lineas.reduce((suma, linea) => suma + linea.total, 0);

        const compra = await tx.compra.create({
          data: {
            proveedor: datos.proveedor,
            numeroFactura: datos.numeroFactura,
            fecha: new Date(datos.fecha),
            total,
            detalles: {
              create: lineas.map((linea) => ({
                cantidad: linea.cantidad,
                precioCompra: linea.precioCompra,
                precioVenta: linea.precioVenta,
                fechaVencimiento: linea.fechaVencimiento,
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

        // 3. Aumentar stock, actualizar precios y recalcular el estado de
        //    cada medicamento.
        for (const linea of lineas) {
          const nuevoStock = linea.stockActual + linea.cantidad;

          await tx.medicamento.update({
            where: { id: linea.medicamentoId },
            data: {
              stock: nuevoStock,
              estado: derivarEstado(nuevoStock),
              precioCompra: linea.precioCompra,
              precioVenta: linea.precioVenta,
            },
          });
        }

        return compra;
      });
    } catch (error) {
      // La factura de compra es única en la base: la duplicada se reporta
      // como 409.
      if (codigoPrisma(error) === 'P2002') {
        throw new ConflictException('El número de factura ya existe');
      }

      // Los errores de negocio (404 medicamento) suben tal cual.
      throw error;
    }
  }

  // Fase 4 (T9): solo se puede modificar proveedor y fecha. Total y detalles
  // se calculan al registrar la compra; tocarlos por fuera descuadraría la
  // compra y el inventario, por eso se rechazan con 400. El número de
  // factura tampoco se puede cambiar (solo proveedor y fecha).
  async update(id: number, datos: UpdateCompraDto) {
    const camposNoPermitidos = (
      ['numeroFactura', 'total', 'detalles'] as const
    ).filter((campo) => datos[campo] !== undefined);

    if (camposNoPermitidos.length > 0) {
      throw new BadRequestException(
        `Solo se puede modificar proveedor y fecha de la compra. Campos no permitidos: ${camposNoPermitidos.join(', ')}. Para corregir el total o los detalles, elimine la compra y regístrela de nuevo (el stock se ajusta).`,
      );
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        return tx.compra.update({
          where: { id },
          data: {
            ...(datos.proveedor !== undefined
              ? { proveedor: datos.proveedor }
              : {}),
            ...(datos.fecha !== undefined ? { fecha: new Date(datos.fecha) } : {}),
          },
        });
      });
    } catch (error) {
      if (codigoPrisma(error) === 'P2025') {
        throw new NotFoundException('Compra no encontrada');
      }

      throw error;
    }
  }

  // Fase 4 (T9): borrar una compra descuenta el stock de cada detalle y
  // recalcula el estado, todo en la misma transacción del borrado. Si el
  // stock actual de un medicamento no alcanza, es porque parte de esa
  // compra ya se vendió: se rechaza con 409 para no descuadrar el
  // inventario. Recién entonces se borra la compra.
  async remove(id: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const compra = await tx.compra.findUnique({
        where: { id },
        include: { detalles: true },
      });

      if (!compra) {
        throw new NotFoundException('Compra no encontrada');
      }

      for (const detalle of compra.detalles) {
        const medicamento = await tx.medicamento.findUnique({
          where: { id: detalle.medicamentoId },
        });

        if (!medicamento) {
          // No debería ocurrir (hay FK), pero no se enmascara.
          throw new NotFoundException(
            `El medicamento "${detalle.medicamentoId}" no existe en el inventario`,
          );
        }

        if (medicamento.stock < detalle.cantidad) {
          throw new ConflictException(
            `No se puede anular la compra: el stock actual de "${medicamento.nombre}" (${medicamento.stock} unidades) es menor que las ${detalle.cantidad} unidades registradas. Parte de esa compra ya se vendió y anularla dejaría el inventario descuadrado.`,
          );
        }

        const nuevoStock = medicamento.stock - detalle.cantidad;

        await tx.medicamento.update({
          where: { id: detalle.medicamentoId },
          data: {
            stock: nuevoStock,
            estado: derivarEstado(nuevoStock),
          },
        });
      }

      await tx.compra.delete({ where: { id } });
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

// Devuelve el código de la librería Prisma si el error lo trae.
function codigoPrisma(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return (error as { code?: string }).code;
  }
  return undefined;
}
