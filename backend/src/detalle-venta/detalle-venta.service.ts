import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

  update(id: number, datos: any) {
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

  create(datos: any) {
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