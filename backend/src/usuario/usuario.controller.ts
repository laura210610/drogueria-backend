import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';

@Controller('usuario')
export class UsuarioController {
  constructor(private usuarioService: UsuarioService) {}

  @Get()
  listar() {
    return this.usuarioService.listar();
  }

  @Post()
  crear(@Body() datos: CreateUsuarioDto) {
    return this.usuarioService.crear(datos);
  }

  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.usuarioService.buscarPorId(Number(id));
  }
}