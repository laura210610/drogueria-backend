-- Restringir duplicados en los números de comprobante.
--
-- Venta.factura y Compra.numeroFactura no tenían restricción de unicidad: el
-- servicio de compras incluso capturaba el error P2002 "La compra ya existe",
-- una rama que nunca se podía ejecutar.
--
-- Se verificó antes de crearla que la base no tiene duplicados:
--   Venta.factura duplicadas          -> 0
--   Compra.numeroFactura duplicadas   -> 0
--   Venta.factura nulas o vacías      -> 0

CREATE UNIQUE INDEX "Venta_factura_key" ON "proyecto10"."Venta"("factura");
CREATE UNIQUE INDEX "Compra_numeroFactura_key" ON "proyecto10"."Compra"("numeroFactura");
