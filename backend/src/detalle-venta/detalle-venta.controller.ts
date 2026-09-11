import {Body,Controller,Delete,Get,Param,Patch,Post,} from '@nestjs/common';
import { DetalleVentaService } from './detalle-venta.service';
import { CreateDetalleVentaDto } from './dto/create-detalle-venta.dto';
import { UpdateDetalleVentaDto } from './dto/update-detalle-venta.dto';

@Controller('detalle-venta')
export class DetalleVentaController {

  constructor(
    private readonly detalleVentaService: DetalleVentaService,
  ) {}

  @Get()
  findAll() {
    return this.detalleVentaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.detalleVentaService.findOne(Number(id));
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() datos: UpdateDetalleVentaDto,
  ) {
    return this.detalleVentaService.update(Number(id), datos);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.detalleVentaService.remove(Number(id));
  }

  @Post()
  create(@Body() datos: CreateDetalleVentaDto) {
    return this.detalleVentaService.create(datos);
  }
}