import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { DetalleCompraController } from './detalle-compra.controller';
import { DetalleCompraService } from './detalle-compra.service';

@Module({
  imports: [PrismaModule],
  controllers: [DetalleCompraController],
  providers: [DetalleCompraService],
})
export class DetalleCompraModule {}