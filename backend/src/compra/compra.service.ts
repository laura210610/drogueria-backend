import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service';

import { CreateCompraDto } from './dto/create-compra.dto';
import { UpdateCompraDto } from './dto/update-compra.dto';

@Injectable()
export class CompraService {
  constructor(private prisma: PrismaService) {}
  
  async create(createCompraDto: CreateCompraDto) {
    try {
      return await this.prisma.compra.create({
        data: createCompraDto,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('La compra ya existe');
      }

      throw error;
    }
  }

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

  async update(id: number, updateCompraDto: UpdateCompraDto) {
    try {
      return await this.prisma.compra.update({
        where: { id },
        data: updateCompraDto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Compra no encontrada');
        }

        if (error.code === 'P2002') {
          throw new ConflictException('La compra ya existe');
        }
      }

      throw error;
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.compra.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Compra no encontrada');
      }

      throw error;
    }
  }
}