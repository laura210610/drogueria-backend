// Fase 4 (T9): PATCH /compra/:id solo permite proveedor y fecha.
// `numeroFactura`, `total` y `detalles` siguen declarados para que el
// ValidationPipe (whitelist) no los quite y el servicio pueda rechazarlos
// con un 400 explícito en vez de ignorarlos en silencio. Tocar total o
// detalles por fuera descuartizaría la compra y el inventario.
export class UpdateCompraDto {
  proveedor?: string;
  numeroFactura?: string;
  fecha?: string;
  total?: number;
  detalles?: unknown[];
}
