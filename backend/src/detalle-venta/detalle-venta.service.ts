import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDetalleVentaDto } from './dto/create-detalle-venta.dto';
import { UpdateDetalleVentaDto } from './dto/update-detalle-venta.dto';

@Injectable()
export class DetalleVentaService {

  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.detalleVenta.findMany();
  }

  findOne(id: number) {
    return this.prisma.detalleVenta.findUnique({
      where: {
        id: id,
      },
    });
  }

  update(id: number, datos: UpdateDetalleVentaDto) {
    return this.prisma.detalleVenta.update({
      where: {
        id: id,
      },
      data: {
        ventaId: datos.ventaId,
        medicamentoId: datos.medicamentoId,
        cantidad: datos.cantidad,
        precio: datos.precio,
        total: datos.total,
      },
    });
  }

  remove(id: number) {
    return this.prisma.detalleVenta.delete({
      where: {
        id: id,
      },
    });
  }

  create(datos: CreateDetalleVentaDto) {
    return this.prisma.detalleVenta.create({
      data: {
        ventaId: datos.ventaId,
        medicamentoId: datos.medicamentoId,
        cantidad: datos.cantidad,
        precio: datos.precio,
        total: datos.total,
      },
    });
  }
}