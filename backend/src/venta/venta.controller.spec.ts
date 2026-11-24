import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import { VentaController } from './venta.controller';

// Como en auth.controller.spec.ts y medicamento.controller.spec.ts: estos
// tests fijan el contrato de acceso de las rutas de venta a nivel de
// metadatos. Con un guard global registrado dejan de ser opcionales.
describe('VentaController - metadata de acceso', () => {
  // Se leen metadatos del metodo; la referencia nunca se invoca.
  const prototipo = VentaController.prototype as unknown as Record<
    string,
    unknown
  >;

  const rolRequerido = (metodo: keyof VentaController): unknown =>
    Reflect.getMetadata(ROLES_KEY, prototipo[metodo] as object) as unknown;

  const esPublica = (metodo: keyof VentaController): unknown =>
    Reflect.getMetadata(IS_PUBLIC_KEY, prototipo[metodo] as object) as unknown;

  it('POST /venta requiere rol admin', () => {
    expect(rolRequerido('create')).toEqual(['admin']);
    expect(esPublica('create')).toBeFalsy();
  });

  it('PATCH /venta/:id requiere rol admin', () => {
    expect(rolRequerido('update')).toEqual(['admin']);
    expect(esPublica('update')).toBeFalsy();
  });

  it('DELETE /venta/:id requiere rol admin', () => {
    expect(rolRequerido('remove')).toEqual(['admin']);
    expect(esPublica('remove')).toBeFalsy();
  });

  it('GET /venta NO es público: exige token de cualquier rol', () => {
    expect(esPublica('findAll')).toBeFalsy();
    expect(rolRequerido('findAll')).toBeUndefined();
  });

  it('GET /venta/:id NO es público: exige token de cualquier rol', () => {
    expect(esPublica('findOne')).toBeFalsy();
    expect(rolRequerido('findOne')).toBeUndefined();
  });
});
