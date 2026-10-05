import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { EvaluacionPersonalDto } from './evaluacion-personal.dto';
import { EvaluacionPublicaDto } from './evaluacion-publica.dto';

describe('HU02: validación de rangos', () => {
  const personalValido = { sexo: 'F', edad: 52, embarazos: 3, glucosa: 148, presion: 84, imc: 31.6, pedigree: 0.55 };

  it('acepta un registro válido sin insulina ni pliegue', async () => {
    const errores = await validate(plainToInstance(EvaluacionPersonalDto, personalValido));
    expect(errores).toHaveLength(0);
  });

  it('rechaza glucosa fuera de rango y muestra el rango válido', async () => {
    const errores = await validate(plainToInstance(EvaluacionPersonalDto, { ...personalValido, glucosa: 500 }));
    expect(errores[0].property).toBe('glucosa');
    expect(Object.values(errores[0].constraints ?? {})[0]).toContain('40 y 400');
  });

  it('rechaza menores de edad', async () => {
    const errores = await validate(plainToInstance(EvaluacionPersonalDto, { ...personalValido, edad: 15 }));
    expect(errores.map((e) => e.property)).toContain('edad');
  });

  it('exige el consentimiento en el test público', async () => {
    const dto = plainToInstance(EvaluacionPublicaDto, {
      sexo: 'M', edad: 40, pesoKg: 80, tallaCm: 170, antecedenteFamiliar: 'Uno', consentimiento: false,
    });
    const errores = await validate(dto);
    expect(errores.map((e) => e.property)).toContain('consentimiento');
  });
});
