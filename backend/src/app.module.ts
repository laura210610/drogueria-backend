import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';
import { VentaModule } from './venta/venta.module';
import { DetalleVentaModule } from './detalle-venta/detalle-venta.module';
import { MedicamentoModule } from './medicamento/medicamento.module';
import { UsuarioModule } from './usuario/usuario.module';
import { AuthModule } from './auth/auth.module';
import { CompraModule } from './compra/compra.module';
import { DetalleCompraModule } from './detalle-compra/detalle-compra.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    PrismaModule,
    VentaModule,
    DetalleVentaModule,
    MedicamentoModule,
    UsuarioModule,
    AuthModule,
    CompraModule,
    DetalleCompraModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Guards globales: primero autenticación JWT, luego roles.
    // Las rutas marcadas con @Public() quedan abiertas.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
