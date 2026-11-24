// Fase 3 (T8): PATCH /venta/:id solo permite cliente y fecha.
// `total`, `detalles`, `factura` y `usuarioId` siguen declarados para que el
// ValidationPipe (whitelist) no los quite y el servicio pueda rechazarlos
// con un 400 explícito en vez de ignorarlos en silencio.
export class UpdateVentaDto {
  usuarioId?: number;
  cliente?: string;
  factura?: string;
  fecha?: string;
  total?: number;
  detalles?: unknown[];
}
