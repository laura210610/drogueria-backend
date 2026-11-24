import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';

// Guard global de JWT: se registra vía APP_GUARD en AppModule.
// Las rutas marcadas con @Public() lo saltan.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const esPublica = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (esPublica) {
      return true;
    }

    return super.canActivate(context);
  }
}
