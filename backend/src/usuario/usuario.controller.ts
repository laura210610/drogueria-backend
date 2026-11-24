import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('usuario')
export class UsuarioController {
  constructor(private usuarioService: UsuarioService) {}

  // Público: el formulario de registro del frontend lo usa.
  // El servidor fuerza rol 'cliente' sin importar lo que envíe el body.
  @Public()
  @Post()
  crear(@Body() datos: CreateUsuarioDto) {
    return this.usuarioService.crear(datos);
  }

  // Gestión de usuarios: solo admin.
  @Roles('admin')
  @Get()
  listar() {
    return this.usuarioService.listar();
  }

  @Roles('admin')
  @Get(':id')
  buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.buscarPorId(id);
  }

  @Roles('admin')
  @Patch(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: UpdateUsuarioDto,
  ) {
    return this.usuarioService.actualizar(id, datos);
  }

  @Roles('admin')
  @Delete(':id')
  async eliminar(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.usuarioService.eliminar(id);
  }
}
