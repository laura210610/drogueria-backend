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

import { CompraService } from './compra.service';
import { CreateCompraDto } from './dto/create-compra.dto';
import { UpdateCompraDto } from './dto/update-compra.dto';
import { Public } from '../common/decorators/public.decorator';

// TODO Fase 2/3/4: quitar @Public() y exigir token/roles cuando el frontend envíe el JWT en todos los módulos de compras.
@Public()
@Controller('compra')
export class CompraController {
  constructor(private readonly compraService: CompraService) {}

  @Get()
  findAll() {
    return this.compraService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.compraService.findOne(id);
  }

  @Post()
  create(@Body() datos: CreateCompraDto) {
    return this.compraService.create(datos);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: UpdateCompraDto,
  ) {
    return this.compraService.update(id, datos);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.compraService.remove(id);
  }
}