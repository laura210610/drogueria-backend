import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import * as bcrypt from 'bcrypt';

type UsuarioPublico = {
  id: number;
  nombre: string;
  correo: string;
  usuario: string;
  rol: string;
};

@Injectable()
export class UsuarioService {
  constructor(private prisma: PrismaService) { }

  async listar(): Promise<UsuarioPublico[]> {
    return this.prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        correo: true,
        usuario: true,
        rol: true,
      },
    });
  }

  async crear(datos: CreateUsuarioDto): Promise<UsuarioPublico> {
    const contrasenaHash = await bcrypt.hash(datos.contrasena, 10);

    return this.prisma.usuario.create({
      data: {
        ...datos,
        contrasena: contrasenaHash,
      },
      select: {
        id: true,
        nombre: true,
        correo: true,
        usuario: true,
        rol: true,
      },
    });
  }

  async buscarPorId(id: number): Promise<UsuarioPublico> {
    const usuario = await this.prisma.usuario.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        nombre: true,
        correo: true,
        usuario: true,
        rol: true,
      },
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
        contrasena: true,
      },
    });
  }

  async verificarContrasena(usuario: string, contrasena: string): Promise<boolean> {
    const credenciales = await this.buscarCredencialesPorUsuario(usuario);

    if (!credenciales) {
      return false;
    }

    return bcrypt.compare(contrasena, credenciales.contrasena);
  }
}