import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateDetalleCompraDto {
  @IsInt()
  compraId!: number;

  @IsString()
  medicamentoId!: string;

  @IsInt()
  cantidad!: number;

  @IsNumber()
  precioCompra!: number;

  @IsNumber()
  precioVenta!: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaVencimiento?: Date;

  @IsNumber()
  total!: number;
}