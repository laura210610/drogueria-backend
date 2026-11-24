import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMedicamentoDto } from './dto/create-medicamento.dto';
import { UpdateMedicamentoDto } from './dto/update-medicamento.dto';

@Injectable()
export class MedicamentoService {
  constructor(private readonly prisma: PrismaService) {}

  // Filtros opcionales por query string. Sin paginación en esta fase.
  async findAll(filtros?: {
    nombre?: string;
    laboratorio?: string;
    estado?: string;
  }) {
    const where: Record<string, unknown> = {
      ...(filtros?.nombre
        ? { nombre: { contains: filtros.nombre, mode: 'insensitive' as const } }
        : {}),
      ...(filtros?.laboratorio
        ? {
            laboratorio: {
              contains: filtros.laboratorio,
              mode: 'insensitive' as const,
            },
          }
        : {}),
      ...(filtros?.estado ? { estado: filtros.estado } : {}),
    };

    return this.prisma.medicamento.findMany({
      ...(Object.keys(where).length > 0 ? { where } : {}),
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: string) {
    const medicamento = await this.prisma.medicamento.findUnique({
      where: { id: id },
    });

    if (!medicamento) {
      throw new NotFoundException('Medicamento no encontrado');
    }

    return medicamento;
  }

  async create(datos: CreateMedicamentoDto) {
    try {
      // Lista blanca explícita; `estado` se deriva del stock, no del body.
      return await this.prisma.medicamento.create({
        data: {
          id: datos.id,
          nombre: datos.nombre,
          laboratorio: datos.laboratorio,
          descripcion: datos.descripcion,
          stock: datos.stock,
          precioCompra: datos.precioCompra,
          precioVenta: datos.precioVenta,
          estado: derivarEstado(datos.stock),
        },
      });
    } catch (error) {
      if (esErrorUnicoDuplicado(error)) {
        throw new ConflictException('El código del medicamento ya existe');
      }

      // Error inesperado: no se enmascara, deja subir.
      throw error;
    }
  }

  async update(id: string, datos: UpdateMedicamentoDto) {
    // Lista blanca explícita con solo los campos que llegan.
    const data: Record<string, unknown> = {
      ...(datos.nombre !== undefined ? { nombre: datos.nombre } : {}),
      ...(datos.laboratorio !== undefined
        ? { laboratorio: datos.laboratorio }
        : {}),
      ...(datos.descripcion !== undefined
        ? { descripcion: datos.descripcion }
        : {}),
      ...(datos.precioCompra !== undefined
        ? { precioCompra: datos.precioCompra }
        : {}),
      ...(datos.precioVenta !== undefined
        ? { precioVenta: datos.precioVenta }
        : {}),
    };

    // Si cambia el stock, el estado se recalcula (el `estado` del body se ignora).
    if (datos.stock !== undefined) {
      data.stock = datos.stock;
      data.estado = derivarEstado(datos.stock);
    }

    try {
      return await this.prisma.medicamento.update({
        where: { id: id },
        data,
      });
    } catch (error) {
      ifEsErrorConocido(error);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.medicamento.delete({
        where: { id: id },
      });
    } catch (error) {
      ifEsErrorConocido(error);
    }
  }
}

// Deriva el estado visible del medicamento a partir del stock.
// Se ignora cualquier `estado` que mande el cliente.
function derivarEstado(stock: number): string {
  if (stock <= 0) return 'Sin stock';
  if (stock < 20) return 'Bajo stock';
  return 'Activo';
}

// Detecta la violación de unique de Prisma (código de medicamento repetido).
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

// Traduce los códigos de Prisma a errores HTTP conocidos y deja
// subir cualquier otro (nunca se enmascara con 404).
function ifEsErrorConocido(error: unknown): void {
  const codigo = codigoPrisma(error);

  if (codigo === 'P2025') {
    throw new NotFoundException('Medicamento no encontrado');
  }

  if (codigo === 'P2002') {
    throw new ConflictException('El código del medicamento ya existe');
  }

  if (codigo === 'P2003') {
    throw new ConflictException(
      'No se puede eliminar el medicamento: tiene movimientos asociados (ventas o compras)',
    );
  }

  throw error;
}
