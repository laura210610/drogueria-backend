import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CompraService } from './compra.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompraDto } from './dto/create-compra.dto';

// Tests de Fase 4 (T9, specs S6 y S7): la compra corre en una única
// $transaction que valida que los medicamentos existan, incrementa el
// stock, actualiza precioCompra/precioVenta del catálogo, recalcula el
// estado y calcula todos los totales desde los precios del detalle.
// Lo que manda el cliente en esos campos se ignora. Todo con Prisma
// mockeado (sin base de datos ni .env).
describe('CompraService', () => {
  let service: CompraService;

  // Objeto de transacción que el mock de $transaction le pasa al callback.
  const tx = {
    medicamento: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    compra: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const prisma = {
    $transaction: jest.fn((fn: (t: typeof tx) => Promise<unknown>) => fn(tx)),
    compra: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const medicamento = (sobreescrito: Record<string, unknown> = {}) => ({
    id: 'MED001',
    nombre: 'Ibuprofeno 400mg',
    stock: 10,
    precioCompra: 1000,
    precioVenta: 1500,
    estado: 'Activo',
    ...sobreescrito,
  });

  const medicamentoFunc = (sobreescrito: Record<string, unknown> = {}) =>
    medicamento({
      id: 'MED002',
      nombre: 'Paracetamol 500mg',
      stock: 30,
      precioCompra: 400,
      precioVenta: 800,
      ...sobreescrito,
    });

  const datosCompra = (
    detalles = [
      {
        medicamentoId: 'MED001',
        cantidad: 2,
        precioCompra: 1200,
        precioVenta: 2000,
      },
    ],
  ) =>
    ({
      // total en el body debe ser ignorado por el servicio.
      total: 99999,
      proveedor: 'Distribuidora Salud',
      numeroFactura: 'C-0001',
      fecha: '2025-01-15',
      detalles: detalles.map((d) => ({ total: 1, ...d })),
    }) as unknown as CreateCompraDto;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [CompraService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<CompraService>(CompraService);
  });

  describe('create - aumento de stock transaccional', () => {
    it('con 2 detalles: incrementa el stock de ambos, actualiza los precios del catálogo y calcula totales e ignora el total del body', async () => {
      tx.medicamento.findUnique.mockImplementation(({ where }) =>
        Promise.resolve(
          where.id === 'MED001'
            ? medicamento()
            : where.id === 'MED002'
              ? medicamentoFunc()
              : Promise.resolve(null),
        ),
      );
      tx.compra.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 1, ...data, detalles: [] }),
      );

      await service.create(
        datosCompra([
          {
            medicamentoId: 'MED001',
            cantidad: 2,
            precioCompra: 1200,
            precioVenta: 2000,
          },
          {
            medicamentoId: 'MED002',
            cantidad: 3,
            precioCompra: 500,
            precioVenta: 900,
          },
        ]),
      );

      // Cabecera: 2 x 1200 + 3 x 500 = 3900, NO el 99999 del body.
      expect(tx.compra.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            proveedor: 'Distribuidora Salud',
            numeroFactura: 'C-0001',
            fecha: new Date('2025-01-15'),
            total: 3900,
          }),
        }),
      );

      // Cada línea: total = cantidad x precioCompra del detalle (no el del body).
      const llamada = tx.compra.create.mock.calls[0][0] as {
        data: { detalles: { create: Record<string, unknown>[] } };
      };
      expect(llamada.data.detalles.create[0]).toEqual(
        expect.objectContaining({
          medicamento: { connect: { id: 'MED001' } },
          cantidad: 2,
          precioCompra: 1200,
          precioVenta: 2000,
          total: 2400,
        }),
      );
      expect(llamada.data.detalles.create[1]).toEqual(
        expect.objectContaining({
          medicamento: { connect: { id: 'MED002' } },
          cantidad: 3,
          precioCompra: 500,
          precioVenta: 900,
          total: 1500,
        }),
      );

      // Stock incrementado y precios del catálogo actualizados con los del detalle.
      expect(tx.medicamento.update).toHaveBeenCalledWith({
        where: { id: 'MED001' },
        data: {
          stock: 12, // 10 + 2, < 20 -> 'Bajo stock'
          estado: 'Bajo stock',
          precioCompra: 1200,
          precioVenta: 2000,
        },
      });
      expect(tx.medicamento.update).toHaveBeenCalledWith({
        where: { id: 'MED002' },
        data: {
          stock: 33, // 30 + 3
          estado: 'Activo',
          precioCompra: 500,
          precioVenta: 900,
        },
      });
    });

    it('recalcula el estado del medicamento según el stock que queda', async () => {
      // 5 + 10 = 15 -> 'Bajo stock' (regla: < 20)
      tx.medicamento.findUnique.mockResolvedValue(
        medicamento({ stock: 5, precioCompra: 1200, precioVenta: 2000 }),
      );
      tx.compra.create.mockResolvedValue({ id: 1 });

      await service.create(
        datosCompra([
          {
            medicamentoId: 'MED001',
            cantidad: 10,
            precioCompra: 1200,
            precioVenta: 2000,
          },
        ]),
      );

      expect(tx.medicamento.update).toHaveBeenCalledWith({
        where: { id: 'MED001' },
        data: {
          stock: 15,
          estado: 'Bajo stock',
          precioCompra: 1200,
          precioVenta: 2000,
        },
      });
    });

    it('la fechaVencimiento del detalle es opcional: la convierte si viene y la deja null si no', async () => {
      tx.medicamento.findUnique.mockResolvedValue(
        medicamento({ precioCompra: 1200, precioVenta: 2000 }),
      );
      tx.compra.create.mockResolvedValue({ id: 1 });

      // La misma llamada se usa para ambos casos; el detalle sin fecha va
      // en la segunda compra.
      await service.create(
        datosCompra([
          {
            medicamentoId: 'MED001',
            cantidad: 1,
            precioCompra: 1200,
            precioVenta: 2000,
            fechaVencimiento: '2026-05-01',
          },
        ]),
      );
      let llamada = tx.compra.create.mock.calls[0][0] as {
        data: { detalles: { create: Record<string, unknown>[] } };
      };
      expect(llamada.data.detalles.create[0]).toEqual(
        expect.objectContaining({
          fechaVencimiento: new Date('2026-05-01'),
        }),
      );

      jest.clearAllMocks();
      tx.medicamento.findUnique.mockResolvedValue(
        medicamento({ precioCompra: 1200, precioVenta: 2000 }),
      );
      tx.compra.create.mockResolvedValue({ id: 1 });

      await service.create(
        datosCompra([
          {
            medicamentoId: 'MED001',
            cantidad: 1,
            precioCompra: 1200,
            precioVenta: 2000,
          },
        ]),
      );
      llamada = tx.compra.create.mock.calls[0][0] as {
        data: { detalles: { create: Record<string, unknown>[] } };
      };
      expect(llamada.data.detalles.create[0]).toEqual(
        expect.objectContaining({ fechaVencimiento: null }),
      );
    });

    it('con medicamento inexistente: 404 claro con el id, y no se escribe nada', async () => {
      tx.medicamento.findUnique.mockResolvedValue(null);

      await expect(
        service.create(
          datosCompra([
            {
              medicamentoId: 'MEDXXX',
              cantidad: 1,
              precioCompra: 1,
              precioVenta: 1,
            },
          ]),
        ),
      ).rejects.toThrow(
        new NotFoundException(
          'El medicamento "MEDXXX" no existe en el inventario',
        ),
      );

      // La transacción abortó antes de escribir: ni compra ni stock cambiaron.
      expect(tx.compra.create).not.toHaveBeenCalled();
      expect(tx.medicamento.update).not.toHaveBeenCalled();
    });

    it('con numeroFactura duplicada (P2002): 409 "El número de factura ya existe"', async () => {
      tx.medicamento.findUnique.mockResolvedValue(
        medicamento({ precioCompra: 1200, precioVenta: 2000 }),
      );
      tx.compra.create.mockRejectedValue({ code: 'P2002' });

      await expect(service.create(datosCompra())).rejects.toThrow(
        new ConflictException('El número de factura ya existe'),
      );
    });

    it('toda la operación corre dentro de una única $transaction', async () => {
      tx.medicamento.findUnique.mockResolvedValue(
        medicamento({ precioCompra: 1200, precioVenta: 2000 }),
      );
      tx.compra.create.mockResolvedValue({ id: 1 });

      await service.create(datosCompra());

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('update - solo proveedor y fecha', () => {
    it('rechaza el body con 400 si trae total', async () => {
      await expect(
        service.update(1, { total: 500 } as never),
      ).rejects.toThrow(BadRequestException);
      expect(tx.compra.update).not.toHaveBeenCalled();
    });

    it('rechaza el body con 400 si trae detalles', async () => {
      await expect(
        service.update(1, { detalles: [] } as never),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza el body con 400 si trae numeroFactura (solo proveedor y fecha)', async () => {
      await expect(
        service.update(1, { numeroFactura: 'C-2' } as never),
      ).rejects.toThrow(BadRequestException);
    });

    it('el mensaje del 400 es explícito sobre los campos permitidos', async () => {
      await expect(
        service.update(1, { total: 500 } as never),
      ).rejects.toThrow(
        'Solo se puede modificar proveedor y fecha de la compra. Campos no permitidos: total',
      );
    });

    it('con proveedor y fecha actualiza solo esos campos', async () => {
      tx.compra.update.mockResolvedValue({ id: 1 });

      await service.update(1, {
        proveedor: 'Nuevo proveedor',
        fecha: '2025-02-01',
      } as never);

      expect(tx.compra.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          proveedor: 'Nuevo proveedor',
          fecha: new Date('2025-02-01'),
        },
      });
    });

    it('si la compra no existe: 404', async () => {
      tx.compra.update.mockRejectedValue({ code: 'P2025' });

      await expect(
        service.update(999, { proveedor: 'X' } as never),
      ).rejects.toThrow(new NotFoundException('Compra no encontrada'));
    });
  });

  describe('remove - descuento de stock transaccional', () => {
    it('descuenta el stock de cada detalle y recalcula el estado, después borra la compra', async () => {
      tx.compra.findUnique.mockResolvedValue({
        id: 1,
        detalles: [
          { medicamentoId: 'MED001', cantidad: 2 },
          { medicamentoId: 'MED002', cantidad: 3 },
        ],
      });
      tx.medicamento.findUnique.mockImplementation(({ where }) =>
        Promise.resolve(
          where.id === 'MED001'
            ? medicamento({ stock: 8, estado: 'Bajo stock' })
            : medicamento({
                id: 'MED002',
                nombre: 'Paracetamol 500mg',
                stock: 20,
                estado: 'Activo',
              }),
        ),
      );

      await service.remove(1);

      expect(tx.medicamento.update).toHaveBeenCalledWith({
        where: { id: 'MED001' },
        // 8 - 2 = 6 -> 'Bajo stock' (regla: < 20)
        data: { stock: 6, estado: 'Bajo stock' },
      });
      expect(tx.medicamento.update).toHaveBeenCalledWith({
        where: { id: 'MED002' },
        // 20 - 3 = 17 -> 'Bajo stock'
        data: { stock: 17, estado: 'Bajo stock' },
      });
      expect(tx.compra.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('si el stock no alcanza (parte de la compra ya se vendió): 409 explicándolo, y no se borra ni se escribe nada', async () => {
      tx.compra.findUnique.mockResolvedValue({
        id: 1,
        detalles: [{ medicamentoId: 'MED001', cantidad: 5 }],
      });
      tx.medicamento.findUnique.mockResolvedValue(
        medicamento({ stock: 3 }),
      );

      await expect(service.remove(1)).rejects.toThrow(
        new ConflictException(
          'No se puede anular la compra: el stock actual de "Ibuprofeno 400mg" (3 unidades) es menor que las 5 unidades registradas. Parte de esa compra ya se vendió y anularla dejaría el inventario descuadrado.',
        ),
      );

      expect(tx.medicamento.update).not.toHaveBeenCalled();
      expect(tx.compra.delete).not.toHaveBeenCalled();
    });

    it('si la compra no existe: 404 y no se escribe nada', async () => {
      tx.compra.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(
        new NotFoundException('Compra no encontrada'),
      );

      expect(tx.medicamento.update).not.toHaveBeenCalled();
      expect(tx.compra.delete).not.toHaveBeenCalled();
    });

    it('toda la anulación corre dentro de una única $transaction', async () => {
      tx.compra.findUnique.mockResolvedValue({
        id: 1,
        detalles: [{ medicamentoId: 'MED001', cantidad: 1 }],
      });
      tx.medicamento.findUnique.mockResolvedValue(
        medicamento({ stock: 8 }),
      );

      await service.remove(1);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('consultas', () => {
    it('findAll y findOne incluyen los detalles yfindOne devuelve 404 si no existe', async () => {
      prisma.compra.findMany.mockResolvedValue([]);
      await service.findAll();
      expect(prisma.compra.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { detalles: true },
        }),
      );

      prisma.compra.findUnique.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(
        new NotFoundException('Compra no encontrada'),
      );
    });
  });
});
