import {Body,Controller,Get,Post,Request,UseGuards,} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

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

    @Post('login')
    login(@Body() datos: LoginDto) {
        return this.authService.login(
            datos.usuario,
            datos.contrasena,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    me(@Request() request: RequestConUsuario) {
        return request.user;
    }
}