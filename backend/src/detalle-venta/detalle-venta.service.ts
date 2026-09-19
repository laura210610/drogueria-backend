import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDetalleVentaDto } from './dto/create-detalle-venta.dto';
import { UpdateDetalleVentaDto } from './dto/update-detalle-venta.dto';

@Injectable()
export class DetalleVentaService {

  constructor(private readonly prisma: PrismaService) { }

  findAll() {
    return this.prisma.detalleVenta.findMany();
  }

  async findOne(id: number) {
    const detalleVenta = await this.prisma.detalleVenta.findUnique({
      where: {
        id: id,
      },
    });

    if (!detalleVenta) {
      throw new NotFoundException('detalle de venta no encontrado')
    }
    return detalleVenta

  }

  async update(id: number, datos: UpdateDetalleVentaDto) {
    try{
    return await this.prisma.detalleVenta.update({
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
  }catch (error) {
    throw new NotFoundException('detalle de venta no encontrado')
  }
}

  async remove(id: number) {
    try{
    return await this.prisma.detalleVenta.delete({
      where: {
        id: id,
      },
    });
  }catch (error) {
    throw new NotFoundException('detalle de venta no encontrado')
  }
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