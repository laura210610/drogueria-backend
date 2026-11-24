import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

// Guard de roles: si la ruta declara @Roles, exige que el usuario
// autenticado tenga alguno de esos roles.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesRequeridos = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Sin @Roles la ruta no restringe por rol (solo exige token si no es @Public).
    if (!rolesRequeridos || rolesRequeridos.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{
      user?: { rol: string } | undefined;
    }>();

    if (!user) {
      // No debería ocurrir: el JwtAuthGuard global corre antes.
      throw new UnauthorizedException('Usuario no autenticado');
    }

    if (!rolesRequeridos.includes(user.rol)) {
      throw new ForbiddenException(
        'No tiene permisos para acceder a este recurso',
      );
    }

    return true;
  }
}
