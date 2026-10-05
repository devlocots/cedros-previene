import { calcularImc, nivelDeRiesgo, PEDIGREE } from './evaluaciones.service';

describe('Reglas de evaluación', () => {
  it('calcula el IMC con un decimal', () => {
    expect(calcularImc(78, 160)).toBe(30.5);
  });

  it('asigna el nivel según los umbrales (15 % y 50 %)', () => {
    expect(nivelDeRiesgo(0.08, 0.15, 0.5)).toBe('Bajo');
    expect(nivelDeRiesgo(0.15, 0.15, 0.5)).toBe('Moderado');
    expect(nivelDeRiesgo(0.49, 0.15, 0.5)).toBe('Moderado');
    expect(nivelDeRiesgo(0.5, 0.15, 0.5)).toBe('Alto');
  });

  it('convierte los antecedentes familiares a un índice creciente', () => {
    expect(PEDIGREE['Ninguno']).toBeLessThan(PEDIGREE['Lejano']);
    expect(PEDIGREE['Uno']).toBeLessThan(PEDIGREE['Dos o más']);
  });
});
