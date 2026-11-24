import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import { DetalleVentaController } from './detalle-venta.controller';

// Fase 3 (T8): los endpoints que mutan /detalle-venta se retiraron porque
// permitían registrar líneas sin descontar stock ni recalcular la venta.
// El stock se gestiona únicamente por /venta. Estos tests fijan que los
// GET exigen token (cualquier rol) y que las rutas de mutación ya no existen.
describe('DetalleVentaController - metadata de acceso y rutas', () => {
  // Se leen metadatos del metodo; la referencia nunca se invoca.
  const prototipo = DetalleVentaController.prototype as unknown as Record<
    string,
    unknown
  >;

  const esPublica = (metodo: keyof DetalleVentaController): unknown =>
    Reflect.getMetadata(IS_PUBLIC_KEY, prototipo[metodo] as object) as unknown;

  it('GET /detalle-venta NO es público: exige token de cualquier rol', () => {
    expect(esPublica('findAll')).toBeFalsy();
  });

  it('GET /detalle-venta/:id NO es público: exige token de cualquier rol', () => {
    expect(esPublica('findOne')).toBeFalsy();
  });

  it('POST /detalle-venta ya no existe como ruta', () => {
    expect(DetalleVentaController.prototype).not.toHaveProperty('create');
  });

  it('PATCH /detalle-venta/:id ya no existe como ruta', () => {
    expect(DetalleVentaController.prototype).not.toHaveProperty('update');
  });

  it('DELETE /detalle-venta/:id ya no existe como ruta', () => {
    expect(DetalleVentaController.prototype).not.toHaveProperty('remove');
  });
});
