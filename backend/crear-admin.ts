import 'dotenv/config';
import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

// Crea el usuario administrador inicial leyendo las credenciales de variables
// de entorno. Antes la contraseña estaba escrita en este archivo ('12345678'),
// lo que la dejaba versionada en el repositorio, y si el usuario ya existía el
// script no hacía nada: no servía para recuperar el acceso.
//
// Variables:
//   ADMIN_USUARIO    (opcional, por defecto "admin")
//   ADMIN_CORREO     (obligatoria solo al crear)
//   ADMIN_CONTRASENA (obligatoria siempre)
//   ADMIN_RESET=1    (o el argumento --reset) reescribe la contraseña si el
//                    usuario ya existe
async function main() {
    const usuario = process.env.ADMIN_USUARIO ?? 'admin';
    const correo = process.env.ADMIN_CORREO;
    const contrasena = process.env.ADMIN_CONTRASENA;
    const reset =
        process.env.ADMIN_RESET === '1' || process.argv.includes('--reset');

    if (!contrasena) {
        console.error(
            'Falta ADMIN_CONTRASENA. Ejemplo:\n' +
                '  ADMIN_CONTRASENA="una-clave-larga" npx ts-node crear-admin.ts',
        );
        process.exitCode = 1;
        return;
    }

    if (contrasena.length < 8) {
        console.error('ADMIN_CONTRASENA debe tener al menos 8 caracteres.');
        process.exitCode = 1;
        return;
    }

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
            where: { usuario },
        });

        const contrasenaHash = await bcrypt.hash(contrasena, 10);

        if (administradorExistente) {
            if (!reset) {
                console.log(
                    `El usuario "${usuario}" ya existe. No se realizaron cambios.` +
                        '\nPara reescribir su contraseña agregá --reset (o ADMIN_RESET=1).',
                );
                return;
            }

            await prisma.usuario.update({
                where: { usuario },
                data: { contrasena: contrasenaHash, rol: 'admin' },
            });

            console.log(
                `Contraseña de "${usuario}" actualizada y rol admin confirmado.`,
            );
            return;
        }

        if (!correo) {
            console.error(
                'Falta ADMIN_CORREO: es obligatorio para crear el usuario.',
            );
            process.exitCode = 1;
            return;
        }

        await prisma.usuario.create({
            data: {
                nombre: 'Administrador',
                correo,
                usuario,
                contrasena: contrasenaHash,
                rol: 'admin',
            },
        });

        console.log(`Administrador "${usuario}" creado correctamente.`);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((error) => {
    console.error('Error al crear el administrador:', error);
    process.exitCode = 1;
});
