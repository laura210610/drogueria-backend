import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Request,
} from '@nestjs/common';
import { VentaService } from './venta.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import { UpdateVentaDto } from './dto/update-venta.dto';
import { Roles } from '../common/decorators/roles.decorator';

// Fase 3 (T8): sin @Public. Las consultas (GET) valen para cualquier rol
// autenticado; las mutaciones solo para admin (RolesGuard global).
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

  // usuarioId siempre sale del token JWT (request.user.id), nunca del body.
  @Roles('admin')
  @Post()
  create(@Body() datos: CreateVentaDto, @Request() request) {
    return this.ventaService.create(datos, request.user.id);
  }

  @Roles('admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() datos: UpdateVentaDto) {
    return this.ventaService.update(Number(id), datos);
  }

  @Roles('admin')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.ventaService.remove(Number(id));
  }
}
