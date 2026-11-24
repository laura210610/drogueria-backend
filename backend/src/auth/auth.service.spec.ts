import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsuarioService } from '../usuario/usuario.service';

describe('AuthService', () => {
  let service: AuthService;

  const usuarioService = {
    buscarCredencialesPorUsuario: jest.fn(),
    verificarContrasena: jest.fn(),
  };

  const jwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsuarioService, useValue: usuarioService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('login válido devuelve access_token y el token incluye el rol del usuario', async () => {
    usuarioService.buscarCredencialesPorUsuario.mockResolvedValue({
      id: 7,
      rol: 'cliente',
    });
    usuarioService.verificarContrasena.mockResolvedValue(true);
    jwtService.signAsync.mockResolvedValue('token-firmado');

    const respuesta = await service.login('ana', 'clave-mock');

    expect(respuesta.access_token).toBe('token-firmado');
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ sub: 7, rol: 'cliente' }),
    );
  });

  it('clave incorrecta lanza UnauthorizedException (401)', async () => {
    usuarioService.buscarCredencialesPorUsuario.mockResolvedValue({
      id: 7,
      rol: 'cliente',
    });
    usuarioService.verificarContrasena.mockResolvedValue(false);

    await expect(service.login('ana', 'clave-mala')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('usuario inexistente lanza UnauthorizedException (401)', async () => {
    usuarioService.buscarCredencialesPorUsuario.mockResolvedValue(null);

    await expect(service.login('fantasma', 'clave-mock')).rejects.toThrow(
      UnauthorizedException,
    );
    expect(usuarioService.verificarContrasena).not.toHaveBeenCalled();
  });
});
