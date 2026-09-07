import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { VentaService } from './venta.service';

@Controller('venta')
export class VentaController {

  constructor(private readonly ventaService: VentaService) {}

  @Get()
  findAll() {
    return this.ventaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ventaService.findOne(Number(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() datos: any) {
    return this.ventaService.update(Number(id), datos);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ventaService.remove(Number(id));
  }

  @Post()
  create(@Body() datos: any) {
    return this.ventaService.create(datos);
  }

}