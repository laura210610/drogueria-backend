import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

// Campos que el admin puede modificar en un usuario existente.
export class UpdateUsuarioDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nombre?: string;

  @IsOptional()
  @IsEmail()
  correo?: string;

  @IsOptional()
  @IsString()
  @IsIn(['admin', 'cliente'])
  rol?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  contrasena?: string;
}
