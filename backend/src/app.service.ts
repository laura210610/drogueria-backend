import { Injectable } from '@nestjs/common';

export interface HealthStatus {
  status: 'ok';
  service: 'drogueria-backend';
}

@Injectable()
export class AppService {
  getHealth(): HealthStatus {
    return {
      status: 'ok',
      service: 'drogueria-backend',
    };
  }
}
