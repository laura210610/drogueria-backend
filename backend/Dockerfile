# Imagen del backend NestJS para el VPS.
#
# La base NO vive acá: el proyecto usa el PostgreSQL de Railway, así que la
# cadena de conexión llega por variable de entorno (DATABASE_URL, con
# sslmode=require). Ver deploy/DESPLIEGUE.md.
FROM node:22-alpine

WORKDIR /app

# prisma.config.ts y el esquema se copian antes de `npm ci` porque el
# postinstall corre `prisma generate` y necesita ambos. Sin esto el install
# falla en la imagen aunque funcione en la máquina de desarrollo.
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma

RUN npm ci

COPY . .

# generate explícito: el cliente generado (generated/) está en .gitignore, así
# que en la imagen hay que construirlo siempre.
RUN npx prisma generate \
    && npm run build

ENV NODE_ENV=production
EXPOSE 3000

# El build emite dist/src/main.js (el cliente Prisma generado fija el rootDir en
# la raíz del proyecto), no dist/main.js.
CMD ["node", "dist/src/main.js"]
