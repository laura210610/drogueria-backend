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
  Query,
} from '@nestjs/common';
import { MedicamentoService } from './medicamento.service';
import { CreateMedicamentoDto } from './dto/create-medicamento.dto';
import { UpdateMedicamentoDto } from './dto/update-medicamento.dto';
import { Roles } from '../common/decorators/roles.decorator';

// Sin @Public: todas las rutas exigen token. Las consultas (GET) valen
// para cualquier rol autenticado; el CRUD solo para admin (RolesGuard global).
@Controller('medicamento')
export class MedicamentoController {
  constructor(private readonly medicamentoService: MedicamentoService) {}

  @Get()
  findAll(
    @Query('nombre') nombre?: string,
    @Query('laboratorio') laboratorio?: string,
    @Query('estado') estado?: string,
  ) {
    return this.medicamentoService.findAll({ nombre, laboratorio, estado });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.medicamentoService.findOne(id);
  }

  @Roles('admin')
  @Post()
  create(@Body() datos: CreateMedicamentoDto) {
    return this.medicamentoService.create(datos);
  }

  @Roles('admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() datos: UpdateMedicamentoDto) {
    return this.medicamentoService.update(id, datos);
  }

  @Roles('admin')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.medicamentoService.remove(id);
  }
}
