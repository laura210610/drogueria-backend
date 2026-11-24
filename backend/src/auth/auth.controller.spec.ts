import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import { AuthController } from './auth.controller';

// Estos tests fijan el contrato de acceso de las rutas de auth a nivel de
// metadatos. Existen por un bug real: `POST /auth/login` tenía el comentario
// "público" pero le faltaba el decorador @Public(), y el JwtAuthGuard global
// lo bloqueaba: nadie podía iniciar sesión. Un test del servicio no lo detecta,
// porque no pasa por el guard.
describe('AuthController - metadata de acceso', () => {
  // Se leen metadatos del metodo; la referencia nunca se invoca.
  const prototipo = AuthController.prototype as unknown as Record<
    string,
    unknown
  >;

  // Devuelve `unknown` a proposito: Reflect.getMetadata es `any` y el
  // resultado se compara en un `expect`, no se usa para nada mas.
  const esPublicaDe = (metodo: keyof AuthController): unknown =>
    Reflect.getMetadata(IS_PUBLIC_KEY, prototipo[metodo] as object) as unknown;

  it('POST /auth/login es público, si no el guard global bloquea el login', () => {
    expect(esPublicaDe('login')).toBe(true);
  });

  it('GET /auth/me NO es público: requiere token', () => {
    expect(esPublicaDe('me')).toBeFalsy();
  });
});
