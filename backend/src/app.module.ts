import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { VentaModule } from './venta/venta.module';
import { DetalleVentaModule } from './detalle-venta/detalle-venta.module';
import { MedicamentoModule } from './medicamento/medicamento.module';

@Module({
  imports: [PrismaModule, ProjectsModule, VentaModule, DetalleVentaModule, MedicamentoModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
