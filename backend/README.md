# Droguería Pili — Backend

API REST del sistema de gestión de droguería. NestJS 11 + Prisma 7 sobre
PostgreSQL (esquema `proyecto10`). El frontend Angular que la consume vive en el
repositorio `Drugstore`.

> Este repositorio tiene el proyecto dentro de `backend/`. Todos los comandos de
> abajo se corren desde ahí.

## Requisitos

- Node.js 22 o superior (probado con Node 22 y 26)
- npm 10 o superior
- Una base PostgreSQL accesible por red (el proyecto apunta a una base en Railway)

## Puesta en marcha desde cero

```bash
cd backend
npm install                 # el postinstall corre `prisma generate`
cp env.example .env         # luego completar los valores (ver tabla abajo)
npm run prisma:status       # debe decir "Database schema is up to date!"
npm run seed                # administrador inicial + catálogo de ejemplo
npm run start:dev           # http://localhost:3000
```

Comprobación rápida de que quedó arriba:

```bash
curl http://localhost:3000
# {"status":"ok","service":"drogueria-backend"}
```

Si la base ya existe y está migrada, `prisma:status` lo confirma. **Si la base es
nueva, `prisma:migrate` no alcanza**: ver la limitación conocida más abajo antes
de seguir.

Funciona igual contra un PostgreSQL local sin TLS. El backend activa SSL solo si
la URL trae `sslmode=require` (el caso de Railway), así que una base local no
necesita certificados.

El archivo de variables **se llama `env.example`**, no `.env.example`: la
política de seguridad del entorno de desarrollo no permite crear archivos con
ese nombre. Copialo tal cual a `.env` (que sí está en `.gitignore`).

## Variables de entorno

Todas se leen de `.env` en `backend/`. La plantilla completa, con comentarios,
está en `env.example`.

| Variable | Obligatoria | Para qué |
| --- | --- | --- |
| `DATABASE_URL` | sí | Conexión PostgreSQL. Formato `postgresql://usuario:clave@host:5432/base?sslmode=require` |
| `JWT_SECRET` | sí | Firma de los tokens. Sin esto el backend no arranca. Generar con `openssl rand -base64 48` |
| `JWT_EXPIRES_IN` | no | Vida del token **en segundos** (no `1h` ni `7d`). Ejemplo: `3600` |
| `PORT` | no | Puerto HTTP. Default `3000`, que es el que espera el frontend |
| `CORS_ORIGIN` | no | Origen permitido. Default `http://localhost:4200`. Varios separados por coma |
| `ADMIN_USUARIO` | no | Usuario del administrador inicial. Default `admin` |
| `ADMIN_CORREO` | al crear el admin | Correo del administrador |
| `ADMIN_CONTRASENA` | al crear el admin | Clave del administrador, mínimo 8 caracteres |
| `ADMIN_RESET` | no | `1` fuerza el cambio de clave del admin existente (ver `crear-admin.ts`) |

Nunca se versionan claves reales.

## Base de datos

### Base nueva vs. base ya migrada

La base se reconstruye desde cero con un solo comando:

```bash
npm run prisma:migrate     # aplica 20261124182455_init_proyecto10 y crea el esquema
```

La migración `20261124182455_init_proyecto10` crea el esquema `proyecto10` y califica
todos los objetos, así que funciona sobre una base vacía. Reemplaza al historial
anterior, que **no** servía para eso: su `init` creaba las tablas sin calificar el
esquema (caían en `public`) y la migración siguiente exigía `proyecto10`, así que
`prisma migrate deploy` fallaba con P3018 `schema "proyecto10" does not exist`.

**Si la base ya existe y tiene el historial anterior aplicado** (es el caso de la
base en Railway), hay que marcarla una sola vez como baselinada, porque sus tablas
ya están creadas:

```bash
npx prisma migrate resolve --applied 20261124182455_init_proyecto10
npm run prisma:status     # debe decir "Database schema is up to date!"
```

Después de eso `migrate deploy` responde "No pending migrations to apply" y no
vuelve a ejecutar DDL. Las filas viejas que quedan en `_prisma_migrations` no
molestan: Prisma las ignora. No borres datos ni el esquema para hacer esto.

### Migraciones y seed

- Las migraciones viven en `prisma/migrations/` y el esquema de Prisma en
  `prisma/schema.prisma`, todo dentro del esquema PostgreSQL `proyecto10`.
- `npm run prisma:status` — estado de las migraciones.
- `npm run prisma:migrate` — aplica las migraciones pendientes (`migrate deploy`).
- `npm run seed` — deja la base usable: crea el administrador y, **si el catálogo
  está vacío**, cinco medicamentos de ejemplo. Es idempotente y nunca modifica ni
  borra filas existentes, así que es seguro sobre una base con datos reales.
- `npm run seed:dry` — informa qué haría el seed sin escribir nada.
- `npx ts-node crear-admin.ts` — crea el administrador. Con `--reset` (o
  `ADMIN_RESET=1`) reescribe la clave de una cuenta que ya existe; el seed no hace
  eso a propósito.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run start:dev` | Servidor en modo watch |
| `npm run start:prod` | Ejecuta `dist/src/main.js` (requiere `npm run build` antes) |
| `npm run build` | Compila a `dist/` |
| `npm test` | Tests unitarios (Jest, sin base de datos: Prisma va mockeado) |
| `npm run test:e2e` | Tests end-to-end |
| `npm run test:cov` | Unitarios con cobertura |
| `npm run lint` | ESLint **con `--fix`**: reescribe archivos |
| `npm run format` | Prettier sobre `src/` y `test/` |

## API

Todo pasa por el guard global de JWT: **sin token, la respuesta es 401**. Solo
las rutas marcadas como públicas quedan abiertas.

| Método y ruta | Permiso | Qué hace |
| --- | --- | --- |
| `GET /` | público | Estado del servicio |
| `POST /auth/login` | público | Devuelve el token y el rol |
| `GET /auth/me` | autenticado | Usuario y rol confirmados por el backend |
| `POST /usuario` | público | Registro; el servidor fuerza `rol = "cliente"` |
| `GET /usuario`, `GET /usuario/:id` | `admin` | Listado y detalle de usuarios |
| `PATCH /usuario/:id`, `DELETE /usuario/:id` | `admin` | Edición y baja |
| `GET /medicamento`, `GET /medicamento/:id` | autenticado | Catálogo |
| `POST /medicamento`, `PATCH /medicamento/:id`, `DELETE /medicamento/:id` | `admin` | Alta, edición y baja |
| `GET /venta`, `GET /venta/:id` | autenticado | Ventas |
| `POST /venta`, `PATCH /venta/:id`, `DELETE /venta/:id` | `admin` | Registrar, editar y anular |
| `GET /compra`, `GET /compra/:id` | autenticado | Compras |
| `POST /compra`, `PATCH /compra/:id`, `DELETE /compra/:id` | `admin` | Registrar, editar y anular |
| `GET /detalle-venta`, `GET /detalle-venta/:id` | autenticado | Líneas de venta |
| `GET /detalle-compra`, `GET /detalle-compra/:id` | autenticado | Líneas de compra |

Reglas de negocio que el servidor impone y el cliente no puede saltear:

- El `estado` del medicamento **se deriva del stock**: `0` → `Sin stock`,
  `< 20` → `Bajo stock`, resto → `Activo`. El valor que mande el cliente se ignora.
- Una venta corre en una transacción: valida stock, recalcula precios y total desde
  el catálogo y descuenta stock. Vender más de lo disponible devuelve 409.
- Una compra corre en una transacción: suma stock y actualiza los precios del
  catálogo. El total se calcula, no se acepta del cliente.
- Correo o usuario duplicado devuelve 409, no 500.
- Anular una venta devuelve el stock. Anular una compra **no** revierte los precios
  que la compra actualizó (limitación conocida, ver el documento de trabajo).

## Tests

```bash
npm test          # 95 tests, 14 suites
npm run test:e2e
```

Los unitarios no necesitan base de datos ni `.env`: Prisma está mockeado. Los e2e
sí levantan la aplicación.

## Estructura

```
backend/
├── prisma/
│   ├── migrations/            # migraciones SQL (esquema proyecto10)
│   ├── schema.prisma          # modelos: Usuario, Medicamento, Compra, Venta y detalles
│   └── seed.ts                # seed idempotente
├── src/
│   ├── auth/                  # login, JWT, guard global y roles
│   ├── usuario/
│   ├── medicamento/
│   ├── venta/ detalle-venta/
│   ├── compra/ detalle-compra/
│   ├── common/guards/         # roles.guard.ts
│   ├── prisma/                # PrismaService
│   └── main.ts                # CORS, ValidationPipe, puerto
├── test/                      # e2e
├── crear-admin.ts             # administrador inicial, con --reset
└── env.example                # plantilla de variables de entorno
```

## Problemas comunes

- **`Can't reach database server`**: `DATABASE_URL` mal armada o la base no acepta
  conexiones desde tu red. Revisá host, puerto, `sslmode=require` y credenciales.
- **`The table ... does not exist`**: faltan migraciones. `npm run prisma:migrate`.
- **El backend arranca pero el frontend recibe error de CORS**: agregá el origen
  real del frontend en `CORS_ORIGIN`.
- **`prisma generate` falla tras clonar**: `npm install` no corrió completo; el
  cliente generado (`generated/prisma/`) está en `.gitignore` a propósito.
- **El login responde 401 con credenciales correctas**: no existe ningún usuario.
  Corré `npm run seed` con `ADMIN_CONTRASENA` definida en el `.env`.
