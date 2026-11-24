import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, } from '@nestjs/common';
import { VentaService } from './venta.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import { UpdateVentaDto } from './dto/update-venta.dto';
import { Public } from '../common/decorators/public.decorator';

// TODO Fase 2/3/4: quitar @Public() y exigir token/roles cuando el frontend envíe el JWT en todos los módulos de ventas.
@Public()
@Controller('venta')
export class VentaController {

  constructor(private readonly ventaService: VentaService) { }

  @Get()
  findAll() {
    return this.ventaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ventaService.findOne(Number(id));
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() datos: UpdateVentaDto,
  ) {
    return this.ventaService.update(Number(id), datos);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.ventaService.remove(Number(id));
  }

  @Post()
  create(@Body() datos: CreateVentaDto) {
    return this.ventaService.create(datos);
  }
}