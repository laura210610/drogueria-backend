import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import { DetalleCompraController } from './detalle-compra.controller';

// Fase 4 (T9): los endpoints que mutan /detalle-compra se retiraron porque
// permitían registrar líneas sin aumentar stock ni recalcular la compra.
// El stock se gestiona únicamente por /compra. Estos tests fijan que los
// GET exigen token (cualquier rol) y que las rutas de mutación ya no existen.
describe('DetalleCompraController - metadata de acceso y rutas', () => {
  // Se leen metadatos del metodo; la referencia nunca se invoca.
  const prototipo = DetalleCompraController.prototype as unknown as Record<
    string,
    unknown
  >;

  const esPublica = (metodo: keyof DetalleCompraController): unknown =>
    Reflect.getMetadata(IS_PUBLIC_KEY, prototipo[metodo] as object) as unknown;

  it('GET /detalle-compra NO es público: exige token de cualquier rol', () => {
    expect(esPublica('findAll')).toBeFalsy();
  });

  it('GET /detalle-compra/:id NO es público: exige token de cualquier rol', () => {
    expect(esPublica('findOne')).toBeFalsy();
  });

  it('POST /detalle-compra ya no existe como ruta', () => {
    expect(DetalleCompraController.prototype).not.toHaveProperty('create');
  });

  it('PATCH /detalle-compra/:id ya no existe como ruta', () => {
    expect(DetalleCompraController.prototype).not.toHaveProperty('update');
  });

  it('DELETE /detalle-compra/:id ya no existe como ruta', () => {
    expect(DetalleCompraController.prototype).not.toHaveProperty('remove');
  });
});
