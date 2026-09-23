import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsString } from 'class-validator';

export class CreateCompraDto {
  @Type(() => Date)
  @IsDate()
  fecha!: Date;

  @IsString()
  proveedor!: string;

  @IsString()
  numeroFactura!: string;

  @IsNumber()
  total!: number;
}