import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hash-simulado'),
  compare: jest.fn(),
}));

describe('UsuarioService', () => {
  let service: UsuarioService;

  const prisma = {
    usuario: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const datosRegistro = {
    nombre: 'Ana Pérez',
    correo: 'ana@example.com',
    usuario: 'ana',
    contrasena: 'clave-segura-123',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsuarioService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<UsuarioService>(UsuarioService);
  });

  it('crear ignora el rol del body y fuerza rol "cliente" (sin escalada de privilegios)', async () => {
    prisma.usuario.create.mockResolvedValue({
      id: 1,
      nombre: 'Ana Pérez',
      correo: 'ana@example.com',
      usuario: 'ana',
      rol: 'cliente',
    });

    const creado = await service.crear({
      ...datosRegistro,
      rol: 'admin',
    } as unknown as CreateUsuarioDto);

    expect(prisma.usuario.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          rol: 'cliente',
          contrasena: 'hash-simulado',
        }),
      }),
    );
    expect(creado.rol).toBe('cliente');
  });

  it('correo o usuario duplicado (P2002) lanza ConflictException (409)', async () => {
    prisma.usuario.create.mockRejectedValue({ code: 'P2002' });

    await expect(service.crear(datosRegistro)).rejects.toThrow(
      ConflictException,
    );
  });

  it('actualizar con contrasena la guarda hasheada y nunca en texto plano', async () => {
    prisma.usuario.update.mockResolvedValue({
      id: 1,
      nombre: 'Ana Editada',
      correo: 'ana@example.com',
      usuario: 'ana',
      rol: 'cliente',
    });

    await service.actualizar(1, {
      nombre: 'Ana Editada',
      contrasena: 'nueva-clave-123',
    });

    const llamada = prisma.usuario.update.mock.calls[0][0] as {
      data: { contrasena?: string };
    };
    expect(llamada.data.contrasena).toBe('hash-simulado');
    expect(llamada.data.contrasena).not.toBe('nueva-clave-123');
  });

  it('actualizar de correo duplicado (P2002) lanza ConflictException (409)', async () => {
    prisma.usuario.update.mockRejectedValue({ code: 'P2002' });

    await expect(
      service.actualizar(1, { correo: 'otro@example.com' }),
    ).rejects.toThrow(ConflictException);
  });

  it('actualizar de usuario inexistente (P2025) lanza NotFoundException', async () => {
    prisma.usuario.update.mockRejectedValue({ code: 'P2025' });

    await expect(
      service.actualizar(999, { nombre: 'Nadie' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('eliminar de usuario inexistente (P2025) lanza NotFoundException', async () => {
    prisma.usuario.delete.mockRejectedValue({ code: 'P2025' });

    await expect(service.eliminar(999)).rejects.toThrow(NotFoundException);
  });
});
