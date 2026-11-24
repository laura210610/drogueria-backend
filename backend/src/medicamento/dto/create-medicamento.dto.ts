import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
  Min,
} from 'class-validator';

export class CreateMedicamentoDto {
  // Código del producto: lo provee el cliente y es la clave primaria.
  // Con id repetido el service responde 409.
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9-]{3,20}$/, {
    message:
      'El código debe tener entre 3 y 20 caracteres (letras, números o guiones)',
  })
  id!: string;

  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  laboratorio!: string;

  @IsString()
  descripcion!: string;

  // El formulario puede mandar estos campos como string: se convierten.
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precioCompra!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precioVenta!: number;

  // Nota: no lleva `estado`. Se deriva del stock en el service y el
  // whitelist del ValidationPipe descarta el valor que envíe el cliente.
}
