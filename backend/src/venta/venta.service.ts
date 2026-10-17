import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import { UpdateVentaDto } from './dto/update-venta.dto';

@Injectable()
export class VentaService {
  constructor(private readonly prisma: PrismaService) { }

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

  async create(datos: CreateVentaDto) {
    return this.prisma.venta.create({
      data: {
        cliente: datos.cliente,
        factura: datos.factura,
        fecha: new Date(datos.fecha),
        total: datos.total,
        ...(datos.usuarioId !== undefined
          ? { usuarioId: datos.usuarioId }
          : {}),
        detalles: {
          create: datos.detalles.map((detalle) => ({
            cantidad: detalle.cantidad,
            precio: detalle.precio,
            total: detalle.total,
            medicamento: {
              connect: {
                id: detalle.medicamentoId,
              },
            },
          })),
        },
      },
      include: {
        detalles: true,
      },
    });
  }

  async update(id: number, datos: UpdateVentaDto) {
    try {
      return await this.prisma.venta.update({
        where: { id },
        data: {
          ...(datos.cliente !== undefined
            ? { cliente: datos.cliente }
            : {}),
          ...(datos.factura !== undefined
            ? { factura: datos.factura }
            : {}),
          ...(datos.fecha !== undefined
            ? { fecha: new Date(datos.fecha) }
            : {}),
          ...(datos.total !== undefined
            ? { total: datos.total }
            : {}),
        },
      });
    } catch {
      throw new NotFoundException('Venta no encontrada');
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.venta.delete({
        where: { id },
      });
    } catch {
      throw new NotFoundException('Venta no encontrada');
    }
  }
}
