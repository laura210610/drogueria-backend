import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { PrismaClient } from '../../generated/prisma/client.js';

import { PrismaPg } from '@prisma/adapter-pg';

import { opcionesDeConexion } from './conexion';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const adapter = new PrismaPg(opcionesDeConexion(process.env.DATABASE_URL), {
      schema: 'proyecto10',
    });

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
