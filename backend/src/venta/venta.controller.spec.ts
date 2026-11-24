import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import { VentaController } from './venta.controller';

// Como en auth.controller.spec.ts y medicamento.controller.spec.ts: estos
// tests fijan el contrato de acceso de las rutas de venta a nivel de
// metadatos. Con un guard global registrado dejan de ser opcionales.
describe('VentaController - metadata de acceso', () => {
  const rolRequerido = (metodo: string) => {
    return Reflect.getMetadata(ROLES_KEY, VentaController.prototype[metodo]);
  };

  const esPublica = (metodo: string) => {
    return Reflect.getMetadata(
      IS_PUBLIC_KEY,
      VentaController.prototype[metodo],
    );
  };

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
