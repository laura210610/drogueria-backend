import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { DetalleCompraService } from './detalle-compra.service';

// Fase 4 (T9): solo quedan las consultas (GET, token de cualquier rol).
// Los endpoints que mutan el detalle de compra se retiraron: permitían
// registrar o editar líneas SIN aumentar stock ni recalcular la compra.
// El stock se gestiona únicamente por /compra (alta con aumento en una
// transacción, borrado con descuento).
@Controller('detalle-compra')
export class DetalleCompraController {
  constructor(
    private readonly detalleCompraService: DetalleCompraService,
  ) {}

  @Get()
  findAll() {
    return this.detalleCompraService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.detalleCompraService.findOne(id);
  }
}
