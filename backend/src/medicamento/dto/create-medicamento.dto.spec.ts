import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateMedicamentoDto } from './create-medicamento.dto';
import { UpdateMedicamentoDto } from './update-medicamento.dto';

// Defecto central que este archivo corrige: los DTOs de medicamento no
// tenían decoradores, y con `whitelist: true` el body llegaba vacío al
// service (POST/PATCH /medicamento se rompían en silencio).
describe('DTO de medicamento - validación', () => {
  const datosValidos = {
    id: 'IBU-400',
    nombre: 'Ibuprofeno 400mg',
    laboratorio: 'Genfar',
    descripcion: 'Analgésico',
    stock: '10', // el formulario puede mandar strings: se convierten
    precioCompra: '1000',
    precioVenta: '2000',
  };

  it('datos válidos con tipos string pasan sin errores', async () => {
    const dto = plainToInstance(CreateMedicamentoDto, datosValidos);

    const errores = await validate(dto);
    expect(errores).toHaveLength(0);
    expect(dto.stock).toBe(10);
    expect(dto.precioVenta).toBe(2000);
  });

  it('id con caracteres prohibidos o largo inválido se rechaza', async () => {
    const dto = plainToInstance(CreateMedicamentoDto, {
      ...datosValidos,
      id: 'ab', // menos de 3
    });
    const erroresIdCorto = await validate(dto);
    expect(erroresIdCorto.some((e) => e.property === 'id')).toBe(true);

    const dtoMalCaracter = plainToInstance(CreateMedicamentoDto, {
      ...datosValidos,
      id: 'IBU 400/', // espacio y barra no permitidos
    });
    const erroresCaracter = await validate(dtoMalCaracter);
    expect(erroresCaracter.some((e) => e.property === 'id')).toBe(true);
  });

  it('body vacío o con faltantes se rechaza campo por campo', async () => {
    const dto = plainToInstance(CreateMedicamentoDto, {
      stock: '10',
    });

    const propiedades = (await validate(dto)).map((e) => e.property);
    expect(propiedades).toEqual(
      expect.arrayContaining([
        'id',
        'nombre',
        'laboratorio',
        'precioCompra',
        'precioVenta',
      ]),
    );
  });

  it('update acepta solo campos opcionales: body vacío es válido y no admite editar el id', async () => {
    const dto = plainToInstance(UpdateMedicamentoDto, {});
    expect(await validate(dto)).toHaveLength(0);

    const sinEstado = plainToInstance(UpdateMedicamentoDto, { stock: '5' });
    const errores = await validate(sinEstado);
    expect(errores).toHaveLength(0);
    expect(sinEstado.stock).toBe(5);
  });
});
