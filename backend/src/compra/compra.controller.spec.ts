import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import { CompraController } from './compra.controller';

// Fase 4 (T9): estos tests fijan el contrato de acceso de las rutas de
// compra a nivel de metadatos. GET valen para cualquier rol autenticado;
// las mutaciones solo para admin (RolesGuard global).
describe('CompraController - metadata de acceso', () => {
  // Se leen metadatos del metodo; la referencia nunca se invoca.
  const prototipo = CompraController.prototype as unknown as Record<
    string,
    unknown
  >;

  const rolRequerido = (metodo: keyof CompraController): unknown =>
    Reflect.getMetadata(ROLES_KEY, prototipo[metodo] as object) as unknown;

  const esPublica = (metodo: keyof CompraController): unknown =>
    Reflect.getMetadata(IS_PUBLIC_KEY, prototipo[metodo] as object) as unknown;

  it('POST /compra requiere rol admin', () => {
    expect(rolRequerido('create')).toEqual(['admin']);
    expect(esPublica('create')).toBeFalsy();
  });

  it('PATCH /compra/:id requiere rol admin', () => {
    expect(rolRequerido('update')).toEqual(['admin']);
    expect(esPublica('update')).toBeFalsy();
  });

  it('DELETE /compra/:id requiere rol admin', () => {
    expect(rolRequerido('remove')).toEqual(['admin']);
    expect(esPublica('remove')).toBeFalsy();
  });

  it('GET /compra NO es público: exige token de cualquier rol', () => {
    expect(esPublica('findAll')).toBeFalsy();
    expect(rolRequerido('findAll')).toBeUndefined();
  });

  it('GET /compra/:id NO es público: exige token de cualquier rol', () => {
    expect(esPublica('findOne')).toBeFalsy();
    expect(rolRequerido('findOne')).toBeUndefined();
  });
});
