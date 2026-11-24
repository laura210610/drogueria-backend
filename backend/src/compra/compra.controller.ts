import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Body,
} from '@nestjs/common';

import { CompraService } from './compra.service';
import { CreateCompraDto } from './dto/create-compra.dto';
import { UpdateCompraDto } from './dto/update-compra.dto';
import { Roles } from '../common/decorators/roles.decorator';

// Fase 4 (T9): sin @Public. Las consultas (GET) valen para cualquier rol
// autenticado; las mutaciones solo para admin (RolesGuard global).
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

  @Roles('admin')
  @Post()
  create(@Body() datos: CreateCompraDto) {
    return this.compraService.create(datos);
  }

  @Roles('admin')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: UpdateCompraDto,
  ) {
    return this.compraService.update(id, datos);
  }

  @Roles('admin')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.compraService.remove(id);
  }
}
