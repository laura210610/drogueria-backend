import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import { UpdateVentaDto } from './dto/update-venta.dto';

@Injectable()
export class VentaService {

  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.venta.findMany();
  }

  async findOne(id: number) {
    const venta = await this.prisma.venta.findUnique({
      where: {
        id: id,
      },
    });

    if(!venta){
      throw new NotFoundException ('Venta no encontrada')
    }
    return venta;
  }

  async update(id: number, datos: UpdateVentaDto) {
    try{
    return  await this.prisma.venta.update({
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
  } catch (error) {
    throw new NotFoundException('Venta no encontrada');
  }
}

  async remove(id: number) {
    try{
    return await this.prisma.venta.delete({
      where: {
        id: id,
      },
    });

  } catch (error) {
    throw new NotFoundException('Venta no encontrada');

  }
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