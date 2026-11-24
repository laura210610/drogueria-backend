import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  const reflector = { getAllAndOverride: jest.fn() };

  const crearContexto = (user: unknown): ExecutionContext => {
    return {
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('sin @Roles la ruta es accesible para cualquiera autenticado', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(crearContexto({ rol: 'cliente' }))).toBe(true);
  });

  it('rol admin pasa en ruta con @Roles("admin")', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);

    expect(
      guard.canActivate(crearContexto({ rol: 'admin' })),
    ).toBe(true);
  });

  it('rol cliente es rechazado con ForbiddenException en ruta con @Roles("admin")', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);

    expect(() =>
      guard.canActivate(crearContexto({ rol: 'cliente' })),
    ).toThrow(ForbiddenException);
  });

  it('sin usuario autenticado lanza UnauthorizedException', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);

    expect(() => guard.canActivate(crearContexto(undefined))).toThrow(
      UnauthorizedException,
    );
  });
});
