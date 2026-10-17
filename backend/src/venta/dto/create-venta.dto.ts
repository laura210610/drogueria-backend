import { Type } from 'class-transformer';
import {IsArray,IsDateString,IsInt,IsNumber,IsOptional,IsString,Min,ValidateNested,} from 'class-validator';

export class CrearDetalleVentaDto {
  @IsString()
  medicamentoId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  cantidad!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precio!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total!: number;
}

export class CreateVentaDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  usuarioId?: number;

  @IsString()
  cliente!: string;

  @IsString()
  factura!: string;

  @IsDateString()
  fecha!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrearDetalleVentaDto)
  detalles!: CrearDetalleVentaDto[];
}
