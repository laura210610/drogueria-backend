import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Fase 3 (T8): solo quedan las consultas. Las mutaciones (create/update/remove)
// se retiraron: permitían registrar o editar líneas SIN descontar stock ni
// recalcular la venta. El stock se gestiona únicamente por /venta.
@Injectable()
export class DetalleVentaService {
  constructor(private readonly prisma: PrismaService) {}

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
      throw new NotFoundException('detalle de venta no encontrado');
    }

    return detalleVenta;
  }
}
