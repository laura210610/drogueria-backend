import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { VentaService } from './venta.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVentaDto } from './dto/create-venta.dto';

// Tests de Fase 3 (T8, specs S5 y S7): la venta corre en una única
// $transaction que valida stock, recalcula precio/total desde el
// medicamento, descuenta stock y recalcula el estado. Todo con Prisma
// mockeado (sin base de datos ni .env).
describe('VentaService', () => {
  let service: VentaService;

  // Objeto de transacción que el mock de $transaction le pasa al callback.
  const tx = {
    medicamento: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    venta: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
  };

  const prisma = {
    $transaction: jest.fn((fn: (t: typeof tx) => Promise<unknown>) => fn(tx)),
    venta: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const medicamentoStock = (sobreescrito: Record<string, unknown> = {}) => ({
    id: 'MED001',
    nombre: 'Ibuprofeno 400mg',
    stock: 10,
    precioVenta: 1500,
    estado: 'Activo',
    ...sobreescrito,
  });

  const datosVenta = (detalles = [{ medicamentoId: 'MED001', cantidad: 2 }]) =>
    ({
      // precio/total/usuarioId en el body deben ser ignorados por el servicio.
      usuarioId: 99,
      total: 99999,
      cliente: 'Pepé Pérez',
      factura: 'F-0001',
      fecha: '2025-01-15',
      detalles: detalles.map((d) => ({ ...d, precio: 1, total: 1 })),
    }) as unknown as CreateVentaDto;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [VentaService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<VentaService>(VentaService);
  });

  describe('create - descuento de stock transaccional', () => {
    it('con stock suficiente: descuenta stock, recalcula precio y total, e ignora el total del body', async () => {
      tx.medicamento.findUnique.mockResolvedValue(medicamentoStock());
      tx.venta.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 1, ...data, detalles: [] }),
      );

      await service.create(datosVenta(), 7);

      expect(tx.venta.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            factura: 'F-0001',
            // total recalculado: 2 x 1500 = 3000, NO el 99999 del body
            total: 3000,
          }),
        }),
      );
      expect(tx.medicamento.update).toHaveBeenCalledWith({
        where: { id: 'MED001' },
        // stock 10 - 2 = 8 -> 'Bajo stock' (regla: < 20)
        data: { stock: 8, estado: 'Bajo stock' },
      });
    });

    it('recalcula cada línea con precioVenta del medicamento, ignorando precio y total del body', async () => {
      tx.medicamento.findUnique.mockResolvedValue(medicamentoStock());
      tx.venta.create.mockResolvedValue({ id: 1 });

      await service.create(datosVenta(), 7);

      const llamada = tx.venta.create.mock.calls[0][0] as {
        data: { detalles: { create: { precio: number; total: number }[] } };
      };
      expect(llamada.data.detalles.create[0]).toEqual(
        expect.objectContaining({ cantidad: 2, precio: 1500, total: 3000 }),
      );
    });

    it('suma el total de varias líneas (dos medicamentos distintos)', async () => {
      tx.medicamento.findUnique.mockImplementation(({ where }) =>
        Promise.resolve(
          where.id === 'MED001'
            ? medicamentoStock()
            : medicamentoStock({
                id: 'MED002',
                nombre: 'Paracetamol 500mg',
                stock: 30,
                precioVenta: 800,
              }),
        ),
      );
      tx.venta.create.mockResolvedValue({ id: 1 });

      await service.create(
        datosVenta([
          { medicamentoId: 'MED001', cantidad: 2 },
          { medicamentoId: 'MED002', cantidad: 3 },
        ]),
        7,
      );

      // 2 x 1500 + 3 x 800 = 5400
      expect(tx.venta.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ total: 5400 }),
        }),
      );
    });

    it('recalcula el estado del medicamento según el stock que queda', async () => {
      // 10 - 10 = 0 -> 'Sin stock'
      tx.medicamento.findUnique.mockResolvedValue(medicamentoStock());
      tx.venta.create.mockResolvedValue({ id: 1 });

      await service.create(
        datosVenta([{ medicamentoId: 'MED001', cantidad: 10 }]),
        7,
      );
      expect(tx.medicamento.update).toHaveBeenCalledWith({
        where: { id: 'MED001' },
        data: { stock: 0, estado: 'Sin stock' },
      });

      jest.clearAllMocks();

      // 25 - 10 = 15 -> 'Bajo stock'
      tx.medicamento.findUnique.mockResolvedValue(
        medicamentoStock({ stock: 25 }),
      );
      tx.venta.create.mockResolvedValue({ id: 1 });

      await service.create(
        datosVenta([{ medicamentoId: 'MED001', cantidad: 10 }]),
        7,
      );
      expect(tx.medicamento.update).toHaveBeenCalledWith({
        where: { id: 'MED001' },
        data: { stock: 15, estado: 'Bajo stock' },
      });
    });

    it('toma usuarioId del token (7), nunca del body (99)', async () => {
      tx.medicamento.findUnique.mockResolvedValue(medicamentoStock());
      tx.venta.create.mockResolvedValue({ id: 1 });

      await service.create(datosVenta(), 7);

      expect(tx.venta.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ usuarioId: 7 }),
        }),
      );
      const data = (tx.venta.create.mock.calls[0][0] as { data: object }).data;
      expect(data).not.toHaveProperty('usuarioId', 99);
    });

    it('con stock insuficiente: 409 con nombre y unidades disponibles, y no se escribe nada', async () => {
      tx.medicamento.findUnique.mockResolvedValue(
        medicamentoStock({ stock: 3 }),
      );

      await expect(
        service.create(
          datosVenta([{ medicamentoId: 'MED001', cantidad: 5 }]),
          7,
        ),
      ).rejects.toThrow(
        new ConflictException(
          'Stock insuficiente para "Ibuprofeno 400mg": disponibles 3, solicitados 5',
        ),
      );

      // La transacción abortó antes de escribir: ni venta ni stock cambiaron.
      expect(tx.venta.create).not.toHaveBeenCalled();
      expect(tx.medicamento.update).not.toHaveBeenCalled();
    });

    it('con medicamento inexistente: 404 claro, y no se escribe nada', async () => {
      tx.medicamento.findUnique.mockResolvedValue(null);

      await expect(
        service.create(
          datosVenta([{ medicamentoId: 'MEDXXX', cantidad: 1 }]),
          7,
        ),
      ).rejects.toThrow(
        new NotFoundException(
          'El medicamento "MEDXXX" no existe en el inventario',
        ),
      );

      expect(tx.venta.create).not.toHaveBeenCalled();
      expect(tx.medicamento.update).not.toHaveBeenCalled();
    });

    it('con factura duplicada (P2002): 409 "El número de factura ya existe"', async () => {
      tx.medicamento.findUnique.mockResolvedValue(medicamentoStock());
      tx.venta.create.mockRejectedValue({ code: 'P2002' });

      await expect(service.create(datosVenta(), 7)).rejects.toThrow(
        new ConflictException('El número de factura ya existe'),
      );
    });

    it('toda la operación corre dentro de una única $transaction', async () => {
      tx.medicamento.findUnique.mockResolvedValue(medicamentoStock());
      tx.venta.create.mockResolvedValue({ id: 1 });

      await service.create(datosVenta(), 7);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('update - solo cliente y fecha', () => {
    it('rechaza el body con 400 si trae total', async () => {
      await expect(service.update(1, { total: 500 })).rejects.toThrow(
        BadRequestException,
      );
      expect(tx.venta.delete).not.toHaveBeenCalled();
    });

    it('rechaza el body con 400 si trae detalles', async () => {
      await expect(service.update(1, { detalles: [] })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rechaza el body con 400 si trae factura o usuarioId (solo cliente y fecha)', async () => {
      await expect(service.update(1, { factura: 'F-2' })).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update(1, { usuarioId: 3 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('el mensaje del 400 es explícito sobre los campos permitidos', async () => {
      await expect(service.update(1, { total: 500 })).rejects.toThrow(
        'Solo se puede modificar cliente y fecha de la venta. Campos no permitidos: total',
      );
    });

    it('con cliente y fecha actualiza solo esos campos', async () => {
      tx.venta.update.mockResolvedValue({ id: 1 });

      await service.update(1, {
        cliente: 'Nuevo cliente',
        fecha: '2025-02-01',
      });

      expect(tx.venta.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { cliente: 'Nuevo cliente', fecha: new Date('2025-02-01') },
      });
    });

    it('si la venta no existe: 404', async () => {
      tx.venta.update.mockRejectedValue({ code: 'P2025' });

      await expect(service.update(999, { cliente: 'X' })).rejects.toThrow(
        new NotFoundException('Venta no encontrada'),
      );
    });
  });

  describe('remove - reposición de stock transaccional', () => {
    it('repone el stock de cada detalle y recalcula el estado, después borra la venta', async () => {
      tx.venta.findUnique.mockResolvedValue({
        id: 1,
        detalles: [
          { medicamentoId: 'MED001', cantidad: 2 },
          { medicamentoId: 'MED002', cantidad: 3 },
        ],
      });
      tx.medicamento.findUnique.mockImplementation(({ where }) =>
        Promise.resolve(
          where.id === 'MED001'
            ? medicamentoStock({ stock: 8, estado: 'Bajo stock' })
            : medicamentoStock({
                id: 'MED002',
                nombre: 'Paracetamol 500mg',
                stock: 17,
                estado: 'Bajo stock',
              }),
        ),
      );

      await service.remove(1);

      expect(tx.medicamento.update).toHaveBeenCalledWith({
        where: { id: 'MED001' },
        // 8 + 2 = 10 -> 'Bajo stock' (regla: < 20)
        data: { stock: 10, estado: 'Bajo stock' },
      });
      expect(tx.medicamento.update).toHaveBeenCalledWith({
        where: { id: 'MED002' },
        // 17 + 3 = 20 -> Activo
        data: { stock: 20, estado: 'Activo' },
      });
      expect(tx.venta.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('si la venta no existe: 404 y no se escribe nada', async () => {
      tx.venta.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(
        new NotFoundException('Venta no encontrada'),
      );

      expect(tx.medicamento.update).not.toHaveBeenCalled();
      expect(tx.venta.delete).not.toHaveBeenCalled();
    });

    it('toda la reposición corre dentro de una única $transaction', async () => {
      tx.venta.findUnique.mockResolvedValue({
        id: 1,
        detalles: [{ medicamentoId: 'MED001', cantidad: 1 }],
      });
      tx.medicamento.findUnique.mockResolvedValue(medicamentoStock());

      await service.remove(1);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });
});
