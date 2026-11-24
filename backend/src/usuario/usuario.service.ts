import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import * as bcrypt from 'bcrypt';

type UsuarioPublico = {
  id: number;
  nombre: string;
  correo: string;
  usuario: string;
  rol: string;
};

const SELECCION_PUBLICA = {
  id: true,
  nombre: true,
  correo: true,
  usuario: true,
  rol: true,
};

@Injectable()
export class UsuarioService {
  constructor(private prisma: PrismaService) {}

  async listar(): Promise<UsuarioPublico[]> {
    return this.prisma.usuario.findMany({
      select: SELECCION_PUBLICA,
    });
  }

  // El rol del body se ignora: el registro público siempre crea 'cliente'.
  async crear(datos: CreateUsuarioDto): Promise<UsuarioPublico> {
    const contrasenaHash = await bcrypt.hash(datos.contrasena, 10);

    try {
      return await this.prisma.usuario.create({
        data: {
          nombre: datos.nombre,
          correo: datos.correo,
          usuario: datos.usuario,
          contrasena: contrasenaHash,
          rol: 'cliente',
        },
        select: SELECCION_PUBLICA,
      });
    } catch (error) {
      if (esErrorUnicoDuplicado(error)) {
        throw new ConflictException(
          'El correo o el usuario ya están registrados',
        );
      }

      throw error;
    }
  }

  async actualizar(
    id: number,
    datos: UpdateUsuarioDto,
  ): Promise<UsuarioPublico> {
    const data: Record<string, string> = {
      ...(datos.nombre !== undefined ? { nombre: datos.nombre } : {}),
      ...(datos.correo !== undefined ? { correo: datos.correo } : {}),
      ...(datos.rol !== undefined ? { rol: datos.rol } : {}),
    };

    if (datos.contrasena !== undefined) {
      data.contrasena = await bcrypt.hash(datos.contrasena, 10);
    }

    try {
      return await this.prisma.usuario.update({
        where: { id: id },
        data,
        select: SELECCION_PUBLICA,
      });
    } catch (error) {
      if (esErrorUnicoDuplicado(error)) {
        throw new ConflictException(
          'El correo o el usuario ya están registrados',
        );
      }

      if (esErrorRegistroNoEncontrado(error)) {
        throw new NotFoundException('Usuario no encontrado');
      }

      throw error;
    }
  }

  async eliminar(id: number): Promise<void> {
    try {
      await this.prisma.usuario.delete({
        where: { id: id },
      });
    } catch (error) {
      if (esErrorRegistroNoEncontrado(error)) {
        throw new NotFoundException('Usuario no encontrado');
      }

      throw error;
    }
  }

  async buscarPorId(id: number): Promise<UsuarioPublico> {
    const usuario = await this.prisma.usuario.findUnique({
      where: {
        id: id,
      },
      select: SELECCION_PUBLICA,
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return usuario;
  }

  async buscarCredencialesPorUsuario(usuario: string) {
    return this.prisma.usuario.findUnique({
      where: {
        usuario: usuario,
      },
      select: {
        id: true,
        rol: true,
        contrasena: true,
      },
    });
  }

  async verificarContrasena(
    usuario: string,
    contrasena: string,
  ): Promise<boolean> {
    const credenciales = await this.buscarCredencialesPorUsuario(usuario);

    if (!credenciales) {
      return false;
    }

    return bcrypt.compare(contrasena, credenciales.contrasena);
  }
}

// Detecta la violación de unique de Prisma (correo o usuario repetido).
function esErrorUnicoDuplicado(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  );
}

// Detecta el error de Prisma cuando el registro a actualizar/borrar no existe.
function esErrorRegistroNoEncontrado(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2025'
  );
}
