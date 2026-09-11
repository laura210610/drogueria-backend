export class UpdateMedicamentoDto {
  id?: string;
  nombre?: string;
  laboratorio?: string;
  descripcion?: string;
  stock?: number;
  precioCompra?: number;
  precioVenta?: number;
  estado?: string;
}