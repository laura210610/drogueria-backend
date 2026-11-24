import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import { MedicamentoController } from './medicamento.controller';

// Como en auth.controller.spec.ts: estos tests fijan el contrato de acceso de
// las rutas de medicamentos a nivel de metadatos. Con un guard global
// registrado dejan de ser opcionales: falta el @Roles() y el CRUD queda
// abierto, sobra un @Public() y queda bloqueada toda la pantalla.
describe('MedicamentoController - metadata de acceso', () => {
  // Se leen metadatos del metodo; la referencia nunca se invoca.
  const prototipo = MedicamentoController.prototype as unknown as Record<
    string,
    unknown
  >;

  const rolRequerido = (metodo: keyof MedicamentoController): unknown =>
    Reflect.getMetadata(ROLES_KEY, prototipo[metodo] as object) as unknown;

  const esPublica = (metodo: keyof MedicamentoController): unknown =>
    Reflect.getMetadata(IS_PUBLIC_KEY, prototipo[metodo] as object) as unknown;

  it('POST /medicamento requiere rol admin', () => {
    expect(rolRequerido('create')).toEqual(['admin']);
    expect(esPublica('create')).toBeFalsy();
  });

  it('PATCH /medicamento/:id requiere rol admin', () => {
    expect(rolRequerido('update')).toEqual(['admin']);
    expect(esPublica('update')).toBeFalsy();
  });

  it('DELETE /medicamento/:id requiere rol admin', () => {
    expect(rolRequerido('remove')).toEqual(['admin']);
    expect(esPublica('remove')).toBeFalsy();
  });

  it('GET /medicamento NO es público: exige token de cualquier rol', () => {
    expect(esPublica('findAll')).toBeFalsy();
    expect(rolRequerido('findAll')).toBeUndefined();
  });

  it('GET /medicamento/:id NO es público: exige token de cualquier rol', () => {
    expect(esPublica('findOne')).toBeFalsy();
    expect(rolRequerido('findOne')).toBeUndefined();
  });
});
