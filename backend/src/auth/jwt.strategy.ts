import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsuarioService } from '../usuario/usuario.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usuarioService: UsuarioService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  // El payload incluye el rol; el usuario devuelto también lo trae
  // para que el RolesGuard pueda decidir.
  async validate(payload: { sub: number; rol: string }) {
    try {
      const usuario = await this.usuarioService.buscarPorId(payload.sub);

      return usuario;
    } catch {
      throw new UnauthorizedException('Usuario no autorizado');
    }
  }
}
