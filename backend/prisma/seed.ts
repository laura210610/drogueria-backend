import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

// Punto de partida para una maquina limpia: deja la base con un administrador
// y, si el catalogo esta vacio, cinco medicamentos de ejemplo.
//
// Es idempotente y NUNCA actualiza ni borra filas existentes: solo crea lo que
// falta. Para reescribir la clave del administrador existe `crear-admin.ts`
// (que si soporta --reset); este seed no toca una cuenta ya creada.
//
// Uso:
//   npm run seed                crea lo que falte
//   npm run seed -- --dry-run   informa que haria, sin escribir nada
//
// Variables (ver env.example):
//   ADMIN_USUARIO     usuario del administrador (por defecto "admin")
//   ADMIN_CORREO      obligatoria para crearlo
//   ADMIN_CONTRASENA  obligatoria para crearlo; si falta, el seed se saltea el
//                     paso del administrador y sigue con el catalogo
const USUARIO_ADMIN_POR_DEFECTO = 'admin';

const CATALOGO_DEMO = [
    {
        id: 'MED-DEMO-01',
        nombre: 'Acetaminofen 500 mg',
        laboratorio: 'Genfar',
        descripcion: 'Tabletas, caja por 20 unidades',
        stock: 50,
        precioCompra: 900,
        precioVenta: 1500,
    },
    {
        id: 'MED-DEMO-02',
        nombre: 'Ibuprofeno 400 mg',
        laboratorio: 'Genfar',
        descripcion: 'Tabletas, caja por 20 unidades',
        stock: 12,
        precioCompra: 1200,
        precioVenta: 2000,
    },
    {
        id: 'MED-DEMO-03',
        nombre: 'Amoxicilina 500 mg',
        laboratorio: 'Tecnoquimicas',
        descripcion: 'Capsulas, caja por 12 unidades',
        stock: 0,
        precioCompra: 2400,
        precioVenta: 3800,
    },
    {
        id: 'MED-DEMO-04',
        nombre: 'Loratadina 10 mg',
        laboratorio: 'MK',
        descripcion: 'Tabletas, caja por 10 unidades',
        stock: 30,
        precioCompra: 700,
        precioVenta: 1200,
    },
    {
        id: 'MED-DEMO-05',
        nombre: 'Suero oral',
        laboratorio: 'Pisa',
        descripcion: 'Sobre de 500 ml, sabor coco',
        stock: 8,
        precioCompra: 1500,
        precioVenta: 2400,
    },
];

// Misma regla que `derivarEstado` en src/medicamento/medicamento.service.ts.
// Se repite aca a proposito: este script corre fuera de Nest y no debe
// importar servicios con decoradores.
function derivarEstado(stock: number): string {
    if (stock <= 0) return 'Sin stock';
    if (stock < 20) return 'Bajo stock';
    return 'Activo';
}

function crearCliente(): PrismaClient {
    const adapter = new PrismaPg(
        {
            connectionString: process.env.DATABASE_URL?.replace(
                'sslmode=require',
                '',
            ),
            ssl: {
                rejectUnauthorized: false,
            },
        },
        {
            schema: 'proyecto10',
        },
    );

    return new PrismaClient({ adapter });
}

async function asegurarAdministrador(
    prisma: PrismaClient,
    dryRun: boolean,
): Promise<void> {
    const usuario = process.env.ADMIN_USUARIO ?? USUARIO_ADMIN_POR_DEFECTO;
    const contrasena = process.env.ADMIN_CONTRASENA;

    if (!contrasena || contrasena === 'cambiar-por-una-clave-de-8-o-mas-caracteres') {
        console.log(
            `[seed] ADMIN_CONTRASENA sin definir: se saltea el administrador "${usuario}".` +
                '\n       Definila en el .env y volve a correr `npm run seed`.',
        );
        return;
    }

    if (contrasena.length < 8) {
        throw new Error('ADMIN_CONTRASENA debe tener al menos 8 caracteres.');
    }

    const existente = await prisma.usuario.findUnique({ where: { usuario } });

    if (existente) {
        console.log(
            `[seed] El usuario "${usuario}" ya existe: no se modifica.` +
                '\n       Para reescribir su clave: ADMIN_CONTRASENA="..." npx ts-node crear-admin.ts --reset',
        );
        return;
    }

    const correo = process.env.ADMIN_CORREO;

    if (!correo) {
        throw new Error(
            `Falta ADMIN_CORREO: es obligatorio para crear el administrador "${usuario}".`,
        );
    }

    if (dryRun) {
        console.log(
            `[seed] (dry-run) crearia el administrador "${usuario}" <${correo}>.`,
        );
        return;
    }

    const contrasenaHash = await bcrypt.hash(contrasena, 10);

    await prisma.usuario.create({
        data: {
            nombre: 'Administrador',
            correo,
            usuario,
            contrasena: contrasenaHash,
            rol: 'admin',
        },
    });

    console.log(`[seed] Administrador "${usuario}" creado.`);
}

async function asegurarCatalogo(
    prisma: PrismaClient,
    dryRun: boolean,
): Promise<void> {
    // Si ya hay medicamentos, la base no esta vacia: no se agrega nada. Asi el
    // seed es seguro de correr sobre una base con datos reales.
    const existentes = await prisma.medicamento.count();

    if (existentes > 0) {
        console.log(
            `[seed] El catalogo ya tiene ${existentes} medicamento(s): no se agrega nada.`,
        );
        return;
    }

    if (dryRun) {
        console.log(
            `[seed] (dry-run) crearia ${CATALOGO_DEMO.length} medicamentos de ejemplo: ${CATALOGO_DEMO.map(
                (m) => m.id,
            ).join(', ')}.`,
        );
        return;
    }

    await prisma.medicamento.createMany({
        data: CATALOGO_DEMO.map((medicamento) => ({
            ...medicamento,
            estado: derivarEstado(medicamento.stock),
        })),
    });

    console.log(
        `[seed] ${CATALOGO_DEMO.length} medicamentos de ejemplo creados: ${CATALOGO_DEMO.map(
            (m) => m.id,
        ).join(', ')}.`,
    );
}

async function main(): Promise<void> {
    const dryRun = process.argv.includes('--dry-run');

    if (!process.env.DATABASE_URL) {
        throw new Error(
            'Falta DATABASE_URL. Copia env.example a .env y completalo.',
        );
    }

    const prisma = crearCliente();

    try {
        if (dryRun) {
            console.log('[seed] Modo --dry-run: no se escribe nada.');
        }

        await asegurarAdministrador(prisma, dryRun);
        await asegurarCatalogo(prisma, dryRun);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((error) => {
    console.error('[seed] Error:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
});
