import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import { CompraController } from './compra.controller';

// Fase 4 (T9): estos tests fijan el contrato de acceso de las rutas de
// compra a nivel de metadatos. GET valen para cualquier rol autenticado;
// las mutaciones solo para admin (RolesGuard global).
describe('CompraController - metadata de acceso', () => {
  const rolRequerido = (metodo: string) => {
    return Reflect.getMetadata(ROLES_KEY, CompraController.prototype[metodo]);
  };

  const esPublica = (metodo: string) => {
    return Reflect.getMetadata(
      IS_PUBLIC_KEY,
      CompraController.prototype[metodo],
    );
  };

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
