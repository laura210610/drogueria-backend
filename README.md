# Droguería Pili — Backend

API REST del sistema de gestión de droguería (NestJS 11 + Prisma 7 + PostgreSQL).

El proyecto vive en [`backend/`](./backend). La guía de instalación, variables de
entorno, endpoints, permisos por rol y solución de problemas está en
[`backend/README.md`](./backend/README.md).

```bash
cd backend
npm install
cp env.example .env      # completar DATABASE_URL y JWT_SECRET
npm run prisma:status
npm run seed
npm run start:dev        # http://localhost:3000
```

Repositorio hermano del frontend: `Drugstore` (Angular). El backend espera que el
frontend corra en `http://localhost:4200` (configurable con `CORS_ORIGIN`).
