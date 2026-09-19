import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class LoginDto {

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