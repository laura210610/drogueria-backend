import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { MedicamentoService } from './medicamento.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMedicamentoDto } from './dto/create-medicamento.dto';
import { UpdateMedicamentoDto } from './dto/update-medicamento.dto';

describe('MedicamentoService', () => {
  let service: MedicamentoService;

  const prisma = {
    medicamento: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const datosValidos = {
    id: 'IBU-400',
    nombre: 'Ibuprofeno 400mg',
    laboratorio: 'Genfar',
    descripcion: 'Analgésico',
    stock: 10,
    precioCompra: 1000,
    precioVenta: 2000,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [MedicamentoService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<MedicamentoService>(MedicamentoService);
  });

  describe('create - estado derivado del stock', () => {
    it('con stock 0 deriva estado "Sin stock"', async () => {
      prisma.medicamento.create.mockResolvedValue({
        ...datosValidos,
        stock: 0,
        estado: 'Sin stock',
      });

      await service.create({ ...datosValidos, stock: 0 } as CreateMedicamentoDto);

      expect(prisma.medicamento.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ stock: 0, estado: 'Sin stock' }),
        }),
      );
    });

    it('con stock 10 deriva estado "Bajo stock"', async () => {
      prisma.medicamento.create.mockResolvedValue({
        ...datosValidos,
        estado: 'Bajo stock',
      });

      await service.create(datosValidos as CreateMedicamentoDto);

      expect(prisma.medicamento.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ stock: 10, estado: 'Bajo stock' }),
        }),
      );
    });

    it('con stock 50 deriva estado "Activo"', async () => {
      prisma.medicamento.create.mockResolvedValue({
        ...datosValidos,
        stock: 50,
        estado: 'Activo',
      });

      await service.create({ ...datosValidos, stock: 50 } as CreateMedicamentoDto);

      expect(prisma.medicamento.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ stock: 50, estado: 'Activo' }),
        }),
      );
    });

    it('ignora el estado que venga en el body (siempre lo deriva del stock)', async () => {
      prisma.medicamento.create.mockResolvedValue({
        ...datosValidos,
        stock: 0,
        estado: 'Sin stock',
      });

      await service.create({
        ...datosValidos,
        stock: 0,
        estado: 'Activo',
      } as unknown as CreateMedicamentoDto);

      expect(prisma.medicamento.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ estado: 'Sin stock' }),
        }),
      );
      expect(
        (prisma.medicamento.create.mock.calls[0][0] as { data: object }).data,
      ).not.toHaveProperty('estado', 'Activo');
    });

    it('guarda solo la lista blanca de campos (sin propiedades extra del body)', async () => {
      prisma.medicamento.create.mockResolvedValue(datosValidos);

      await service.create(datosValidos as CreateMedicamentoDto);

      const llamada = prisma.medicamento.create.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      expect(Object.keys(llamada.data).sort()).toEqual([
        'descripcion',
        'estado',
        'id',
        'laboratorio',
        'nombre',
        'precioCompra',
        'precioVenta',
        'stock',
      ]);
    });
  });

  it('create con id duplicado (P2002) lanza ConflictException (409)', async () => {
    prisma.medicamento.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      service.create(datosValidos as CreateMedicamentoDto),
    ).rejects.toThrow(ConflictException);
  });

  describe('update', () => {
    it('recalcula el estado cuando cambia el stock (50 a 0 → "Sin stock")', async () => {
      prisma.medicamento.update.mockResolvedValue({
        ...datosValidos,
        stock: 50,
        estado: 'Sin stock',
      });

      await service.update('IBU-400', { stock: 0 } as UpdateMedicamentoDto);

      expect(prisma.medicamento.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'IBU-400' },
          data: expect.objectContaining({ stock: 0, estado: 'Sin stock' }),
        }),
      );
    });

    it('sin stock en el body no toca el estado existente', async () => {
      prisma.medicamento.update.mockResolvedValue(datosValidos);

      await service.update('IBU-400', { nombre: 'Nombre nuevo' } as UpdateMedicamentoDto);

      const llamada = prisma.medicamento.update.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      expect(llamada.data).toEqual({ nombre: 'Nombre nuevo' });
    });

    it('ignora el estado del body y solo envía campos definidos', async () => {
      prisma.medicamento.update.mockResolvedValue(datosValidos);

      await service.update(
        'IBU-400',
        { stock: 5, estado: 'Activo' } as unknown as UpdateMedicamentoDto,
      );

      const llamada = prisma.medicamento.update.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      expect(llamada.data).toEqual({ stock: 5, estado: 'Bajo stock' });
    });

    it('registro inexistente (P2025) lanza NotFoundException (404)', async () => {
      prisma.medicamento.update.mockRejectedValue({ code: 'P2025' });

      await expect(
        service.update('NO-EXISTE', { stock: 1 } as UpdateMedicamentoDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  it('findOne inexistente lanza NotFoundException (404)', async () => {
    prisma.medicamento.findUnique.mockResolvedValue(null);

    await expect(service.findOne('NO-EXISTE')).rejects.toThrow(
      NotFoundException,
    );
  });

  describe('remove', () => {
    it('error de clave foránea (P2003) lanza ConflictException mencionando los movimientos', async () => {
      prisma.medicamento.delete.mockRejectedValue({ code: 'P2003' });

      let capturado: unknown;
      try {
        await service.remove('IBU-400');
      } catch (error) {
        capturado = error;
      }

      expect(capturado).toBeInstanceOf(ConflictException);
      expect((capturado as ConflictException).message).toMatch(
        /movimientos/i,
      );
      expect((capturado as ConflictException).message).toMatch(
        /ventas o compras/i,
      );
    });

    it('registro inexistente (P2025) lanza NotFoundException (404)', async () => {
      prisma.medicamento.delete.mockRejectedValue({ code: 'P2025' });

      await expect(service.remove('NO-EXISTE')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('ordena por nombre y nota el where cuando hay filtros', async () => {
      prisma.medicamento.findMany.mockResolvedValue([]);

      await service.findAll({
        nombre: 'ibu',
        laboratorio: 'gen',
        estado: 'Bajo stock',
      });

      expect(prisma.medicamento.findMany).toHaveBeenCalledWith({
        where: {
          nombre: { contains: 'ibu', mode: 'insensitive' },
          laboratorio: { contains: 'gen', mode: 'insensitive' },
          estado: 'Bajo stock',
        },
        orderBy: { nombre: 'asc' },
      });
    });

    it('sin filtros no envía where', async () => {
      prisma.medicamento.findMany.mockResolvedValue([]);

      await service.findAll();

      expect(prisma.medicamento.findMany).toHaveBeenCalledWith({
        orderBy: { nombre: 'asc' },
      });
    });
  });
});
