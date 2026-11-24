import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

// No lleva `id` (la clave primaria no se edita) ni `estado` (se deriva del
// stock en el service; el whitelist del ValidationPipe descarta el del body).
export class UpdateMedicamentoDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nombre?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  laboratorio?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  precioCompra?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  precioVenta?: number;
}
