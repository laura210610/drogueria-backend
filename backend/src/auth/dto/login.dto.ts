import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class LoginDto {

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  usuario!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  contrasena!: string;
}
