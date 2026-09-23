import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { DetalleCompraService } from './detalle-compra.service';
import { CreateDetalleCompraDto } from './dto/create-detalle-compra.dto';
import { UpdateDetalleCompraDto } from './dto/update-detalle-compra.dto';

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

  @Post()
  create(@Body() datos: CreateDetalleCompraDto) {
    return this.detalleCompraService.create(datos);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: UpdateDetalleCompraDto,
  ) {
    return this.detalleCompraService.update(id, datos);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.detalleCompraService.remove(id);
  }
}