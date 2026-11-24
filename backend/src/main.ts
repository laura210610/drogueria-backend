import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Origen permitido configurable por variable de entorno
  // (separado por comas si hace falta más de uno).
  const corsOrigin = (process.env.CORS_ORIGIN ?? 'http://localhost:4200')
    .split(',')
    .map((origen) => origen.trim());

  app.enableCors({ origin: corsOrigin });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((error) => {
  console.error('No se pudo iniciar el backend:', error);
  process.exitCode = 1;
});
