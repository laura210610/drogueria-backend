import { Injectable, NotAcceptableException, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateMedicamentoDto } from './dto/create-medicamento.dto';
import { UpdateMedicamentoDto } from './dto/update-medicamento.dto';
import { NotFoundError } from 'rxjs';

@Injectable()
export class MedicamentoService {

  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    this.prisma.medicamento.findMany();
  }

  async findOne(id: string) {
    const medicamento = await this.prisma.medicamento.findUnique({
      where: {
        id: id,
      },
    });

    if(!medicamento){
      throw new NotFoundException('Medicamento no encontrado')
    }
    return medicamento;
  }

  async update(id: string, datos: UpdateMedicamentoDto) {

    try{
    return await this.prisma.medicamento.update({
      where: {
        id: id,
      },
      data: {
        nombre: datos.nombre,
        laboratorio: datos.laboratorio,
        descripcion: datos.descripcion,
        stock: datos.stock,
        precioCompra: datos.precioCompra,
        precioVenta: datos.precioVenta,
        estado: datos.estado,
      },
    });
  } catch(error){
    throw new NotFoundException('Medicamento no encontrado')
  }
}

  async remove(id: string) {
    
    try{
    return await this.prisma.medicamento.delete({
      where: {
        id: id,
      },
    });
  }catch(error){
    throw new NotFoundException('Medicamento no encontrado')

  }
}

  create(datos: CreateMedicamentoDto) {
    return this.prisma.medicamento.create({
      data: {
        id: datos.id,
        nombre: datos.nombre,
        laboratorio: datos.laboratorio,
        descripcion: datos.descripcion,
        stock: datos.stock,
        precioCompra: datos.precioCompra,
        precioVenta: datos.precioVenta,
        estado: datos.estado,
      },
    });
  }
}