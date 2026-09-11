export class CreateVentaDto {
  usuarioId?: number;
  cliente!: string;
  factura!: string;
  fecha!: string;
  total!: number;
}