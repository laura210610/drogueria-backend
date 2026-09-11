import { Module } from '@nestjs/common';
import { MedicamentoController } from './medicamento.controller';
import { MedicamentoService } from './medicamento.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [MedicamentoController],
    providers: [MedicamentoService],
})
export class MedicamentoModule { }