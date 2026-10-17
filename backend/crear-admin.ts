import 'dotenv/config';
import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

async function main() {
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

    const prisma = new PrismaClient({ adapter });

    try {
        const administradorExistente = await prisma.usuario.findUnique({
            where: { usuario: 'admin' },
        });

        if (administradorExistente) {
            console.log('El usuario admin ya existe. No se realizaron cambios.');
            return;
        }

        const contrasenaHash = await bcrypt.hash('12345678', 10);

        await prisma.usuario.create({
            data: {
                nombre: 'Administrador',
                correo: 'admin@drogueriapili.com',
                usuario: 'admin',
                contrasena: contrasenaHash,
                rol: 'admin',
            },
        });

        console.log('Administrador creado correctamente.');
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((error) => {
    console.error('Error al crear el administrador:', error);
    process.exitCode = 1;
});
