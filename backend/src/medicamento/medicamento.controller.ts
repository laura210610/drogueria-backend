import {Body,Controller,Delete,Get,Param,Patch,Post,} from '@nestjs/common';
import { MedicamentoService } from './medicamento.service';

@Controller('medicamento')
export class MedicamentoController {

    constructor(private readonly medicamentoService: MedicamentoService) { }

    @Get()
    findAll() {
        return this.medicamentoService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.medicamentoService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() datos: any) {
        return this.medicamentoService.update(id, datos);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.medicamentoService.remove(id);
    }

    @Post()
    create(@Body() datos: any) {
        return this.medicamentoService.create(datos);
    }

}