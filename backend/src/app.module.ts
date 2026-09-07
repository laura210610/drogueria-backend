import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { VentaModule } from './venta/venta.module';

@Module({
  imports: [PrismaModule, ProjectsModule, VentaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
