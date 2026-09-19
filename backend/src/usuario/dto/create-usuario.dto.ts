import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

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

  @IsString()
  @IsNotEmpty()
  rol!: string;
}