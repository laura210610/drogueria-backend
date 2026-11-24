import { Controller, Get, Param } from '@nestjs/common';
import { DetalleVentaService } from './detalle-venta.service';

// Fase 3 (T8): solo quedan las consultas (GET, token de cualquier rol).
// Los endpoints que mutan el detalle de venta se retiraron: permitían
// registrar o editar líneas SIN descontar stock ni recalcular la venta.
// El stock se gestiona únicamente por /venta (alta con descuento en una
// transacción, borrado con reposición).
@Controller('detalle-venta')
export class DetalleVentaController {
  constructor(private readonly detalleVentaService: DetalleVentaService) {}

  @Get()
  findAll() {
    return this.detalleVentaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.detalleVentaService.findOne(Number(id));
  }
}
