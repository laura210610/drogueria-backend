import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service';

import { CreateDetalleCompraDto } from './dto/create-detalle-compra.dto';
import { UpdateDetalleCompraDto } from './dto/update-detalle-compra.dto';

@Injectable()
export class DetalleCompraService {
  constructor(private prisma: PrismaService) {}

  async create(createDetalleCompraDto: CreateDetalleCompraDto) {
    try {
      return await this.prisma.detalleCompra.create({
        data: createDetalleCompraDto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new BadRequestException(
            'La compra o el medicamento no existen',
          );
        }

        if (error.code === 'P2002') {
          throw new ConflictException('El detalle de compra ya existe');
        }
      }

      throw error;
    }
  }

  async findAll() {
    return await this.prisma.detalleCompra.findMany({
      include: {
        compra: true,
        medicamento: true,
      },
    });
  }

  async findOne(id: number) {
    const detalleCompra = await this.prisma.detalleCompra.findUnique({
      where: { id },
      include: {
        compra: true,
        medicamento: true,
      },
    });

    if (!detalleCompra) {
      throw new NotFoundException('Detalle de compra no encontrado');
    }

    return detalleCompra;
  }

  async update(
    id: number,
    updateDetalleCompraDto: UpdateDetalleCompraDto,
  ) {
    try {
      return await this.prisma.detalleCompra.update({
        where: { id },
        data: updateDetalleCompraDto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Detalle de compra no encontrado');
        }

        if (error.code === 'P2003') {
          throw new BadRequestException(
            'La compra o el medicamento no existen',
          );
        }

        if (error.code === 'P2002') {
          throw new ConflictException('El detalle de compra ya existe');
        }
      }

      throw error;
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.detalleCompra.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Detalle de compra no encontrado');
      }

      throw error;
    }
  }
}