-- Migración única que reconstruye la base desde cero.
--
-- Reemplaza al historial anterior (init 20260826215632 + unico_facturas
-- 20260827000000): `init` creaba las tablas sin calificar el esquema, así que
-- en una base vacía caían en `public` y la segunda migración, que sí califica
-- `proyecto10`, fallaba con P3018 ("schema does not exist"). Este squash crea
-- el esquema y califica todos los objetos, de modo que `prisma migrate deploy`
-- funciona sobre una base limpia sin pasos manuales.
--
-- Venta.factura y Compra.numeroFactura tienen índice único (los mismos que
-- imponía la migración `unico_facturas`): sin esa restricción el servicio de
-- compras capturaba el error P2002 "La compra ya existe", una rama que nunca se
-- podía ejecutar. Se verificó al crear la restricción original que la base no
-- tenía duplicados:
--   Venta.factura duplicadas          -> 0
--   Compra.numeroFactura duplicadas   -> 0
--   Venta.factura nulas o vacías      -> 0

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "proyecto10";

-- CreateTable
CREATE TABLE "proyecto10"."Usuario" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "contrasena" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'cliente',

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proyecto10"."Medicamento" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "laboratorio" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "stock" INTEGER NOT NULL,
    "precioCompra" DOUBLE PRECISION NOT NULL,
    "precioVenta" DOUBLE PRECISION NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Activo',

    CONSTRAINT "Medicamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proyecto10"."Compra" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "proveedor" TEXT NOT NULL,
    "numeroFactura" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proyecto10"."DetalleCompra" (
    "id" SERIAL NOT NULL,
    "compraId" INTEGER NOT NULL,
    "medicamentoId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioCompra" DOUBLE PRECISION NOT NULL,
    "precioVenta" DOUBLE PRECISION NOT NULL,
    "fechaVencimiento" TIMESTAMP(3),
    "total" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "DetalleCompra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proyecto10"."Venta" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER,
    "cliente" TEXT NOT NULL,
    "factura" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Venta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proyecto10"."DetalleVenta" (
    "id" SERIAL NOT NULL,
    "ventaId" INTEGER NOT NULL,
    "medicamentoId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "DetalleVenta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "proyecto10"."Usuario"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_usuario_key" ON "proyecto10"."Usuario"("usuario");

-- CreateIndex
CREATE UNIQUE INDEX "Compra_numeroFactura_key" ON "proyecto10"."Compra"("numeroFactura");

-- CreateIndex
CREATE UNIQUE INDEX "Venta_factura_key" ON "proyecto10"."Venta"("factura");

-- AddForeignKey
ALTER TABLE "proyecto10"."DetalleCompra" ADD CONSTRAINT "DetalleCompra_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "proyecto10"."Compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto10"."DetalleCompra" ADD CONSTRAINT "DetalleCompra_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "proyecto10"."Medicamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto10"."Venta" ADD CONSTRAINT "Venta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "proyecto10"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto10"."DetalleVenta" ADD CONSTRAINT "DetalleVenta_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "proyecto10"."Venta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto10"."DetalleVenta" ADD CONSTRAINT "DetalleVenta_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "proyecto10"."Medicamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
