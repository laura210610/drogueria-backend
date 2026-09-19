import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuarioService } from '../usuario/usuario.service';

@Injectable()
export class AuthService {
    constructor(
        private usuarioService: UsuarioService,
        private jwtService: JwtService,
    ) { }

    async login(usuario: string, contrasena: string) {
        const credenciales =
            await this.usuarioService.buscarCredencialesPorUsuario(usuario);

        if (!credenciales) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        const contrasenaValida =
            await this.usuarioService.verificarContrasena(usuario, contrasena);

        if (!contrasenaValida) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        const access_token = await this.jwtService.signAsync({
            sub: credenciales.id,
        });

        return {
            access_token,
            token_type: 'Bearer',
             expires_in: Number(process.env.JWT_EXPIRES_IN ?? 3600),
        };
    }
}