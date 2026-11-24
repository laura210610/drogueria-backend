import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CrearDetalleCompraDto {
  @IsString()
  medicamentoId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  cantidad!: number;

  // Fase 4 (T9): la compra fija los precios nuevos del catálogo. El total de
  // la línea se recalcula en el backend (cantidad x precioCompra).
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precioCompra!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precioVenta!: number;

  @IsOptional()
  @IsDateString()
  fechaVencimiento?: string;
}

// Fase 4 (T9): el backend recalcula el total de la compra como la suma de
// los totales de los detalles, así que el cliente ya no lo manda.
export class CreateCompraDto {
  @IsString()
  proveedor!: string;

  @IsString()
  numeroFactura!: string;

  @IsDateString()
  fecha!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrearDetalleCompraDto)
  detalles!: CrearDetalleCompraDto[];
}
