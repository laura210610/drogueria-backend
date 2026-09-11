import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MedicamentoService {

    constructor(private readonly prisma: PrismaService) { }

    findAll() {
        return this.prisma.medicamento.findMany();
    }

    findOne(id: string) {
        return this.prisma.medicamento.findUnique({
            where: {
                id: id,
            },
        });
    }

    update(id: string, datos: any) {
        return this.prisma.medicamento.update({
            where: {
                id: id,
            },
            data: {
                nombre: datos.nombre,
                laboratorio: datos.laboratorio,
                descripcion: datos.descripcion,
                stock: datos.stock,
                precioCompra: datos.precioCompra,
                precioVenta: datos.precioVenta,
                estado: datos.estado,
            },
        });
    }

    remove(id: string) {
        return this.prisma.medicamento.delete({
            where: {
                id: id,
            },
        });
    }

    create(datos: any) {
        return this.prisma.medicamento.create({
            data: {
                id: datos.id,
                nombre: datos.nombre,
                laboratorio: datos.laboratorio,
                descripcion: datos.descripcion,
                stock: datos.stock,
                precioCompra: datos.precioCompra,
                precioVenta: datos.precioVenta,
                estado: datos.estado,
            },
        });
    }

}