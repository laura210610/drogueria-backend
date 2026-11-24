import { Body, Controller, Get, Post, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

type RequestConUsuario = {
    user: {
        id: number;
        nombre: string;
        correo: string;
        usuario: string;
        rol: string;
    };
};

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    // Público: el logín no pide token (el JwtAuthGuard global está en AppModule).
    @Post('login')
    login(@Body() datos: LoginDto) {
        return this.authService.login(
            datos.usuario,
            datos.contrasena,
        );
    }

    @Get('me')
    me(@Request() request: RequestConUsuario) {
        return request.user;
    }
}
