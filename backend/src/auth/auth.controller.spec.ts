import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import { AuthController } from './auth.controller';

// Estos tests fijan el contrato de acceso de las rutas de auth a nivel de
// metadatos. Existen por un bug real: `POST /auth/login` tenía el comentario
// "público" pero le faltaba el decorador @Public(), y el JwtAuthGuard global
// lo bloqueaba: nadie podía iniciar sesión. Un test del servicio no lo detecta,
// porque no pasa por el guard.
describe('AuthController - metadata de acceso', () => {
  it('POST /auth/login es público, si no el guard global bloquea el login', () => {
    const esPublica = Reflect.getMetadata(
      IS_PUBLIC_KEY,
      AuthController.prototype.login,
    );

    expect(esPublica).toBe(true);
  });

  it('GET /auth/me NO es público: requiere token', () => {
    const esPublica = Reflect.getMetadata(
      IS_PUBLIC_KEY,
      AuthController.prototype.me,
    );

    expect(esPublica).toBeFalsy();
  });
});
