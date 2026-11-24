import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

// Fase 4 (T9): solo quedan las consultas (GET). Crear, editar o borrar
// detalles por fuera de la compra permitía tocar el inventario sin
// aumentarlo; el stock se gestiona únicamente por /compra (alta con
// aumento de stock y borrado con descuento, ambos transaccionales).
@Injectable()
export class DetalleCompraService {
  constructor(private prisma: PrismaService) {}

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
}
