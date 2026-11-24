import { Controller, Get } from '@nestjs/common';
import { AppService, HealthStatus } from './app.service';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Público: estado del servicio.
  @Public()
  @Get()
  getHealth(): HealthStatus {
    return this.appService.getHealth();
  }
}
