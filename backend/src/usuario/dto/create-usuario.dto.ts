import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

// El frontend envía también `rol`, pero no se declara aquí: el ValidationPipe
// con whitelist lo descarta y el servicio siempre asigna rol 'cliente'.
export class CreateUsuarioDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsEmail()
  @IsNotEmpty()
  correo!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  usuario!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  @MinLength(8)
  contrasena!: string;
}
