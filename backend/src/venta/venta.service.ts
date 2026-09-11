import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateVentaDto } from './dto/create-venta.dto';
import { UpdateVentaDto } from './dto/update-venta.dto';

@Injectable()
export class VentaService {

  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.venta.findMany();
  }

  findOne(id: number) {
    return this.prisma.venta.findUnique({
      where: {
        id: id,
      },
    });
  }

  update(id: number, datos: UpdateVentaDto) {
    return this.prisma.venta.update({
      where: {
        id: id,
      },
      data: {
        cliente: datos.cliente,
        factura: datos.factura,
        fecha: new Date(datos.fecha!),
        total: datos.total,
      },
    });
  }

  remove(id: number) {
    return this.prisma.venta.delete({
      where: {
        id: id,
      },
    });
  }

  create(datos: CreateVentaDto) {
    return this.prisma.venta.create({
      data: {
        cliente: datos.cliente,
        factura: datos.factura,
        fecha: new Date(datos.fecha),
        total: datos.total,
      },
    });
  }
}