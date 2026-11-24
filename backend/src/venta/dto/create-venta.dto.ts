import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

// Fase 3 (T8): el backend recalcula precio y total desde el medicamento, así
// que el cliente ya no los manda. usuarioId también se retiró del body:
// sale del token JWT.

export class CrearDetalleVentaDto {
  @IsString()
  medicamentoId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  cantidad!: number;
}

export class CreateVentaDto {
  @IsString()
  cliente!: string;

  @IsString()
  factura!: string;

  @IsDateString()
  fecha!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrearDetalleVentaDto)
  detalles!: CrearDetalleVentaDto[];
}
