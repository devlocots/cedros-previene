/** Rangos fisiológicos (HU02). Deben coincidir con los del backend y el servicio de ML. */
export interface Rango {
  min: number;
  max: number;
  mensaje: string;
}

export const RANGOS: Record<string, Rango> = {
  edad: { min: 18, max: 100, mensaje: 'La edad debe estar entre 18 y 100 años.' },
  embarazos: { min: 0, max: 20, mensaje: 'Los embarazos deben estar entre 0 y 20.' },
  pesoKg: { min: 30, max: 250, mensaje: 'El peso debe estar entre 30 y 250 kg.' },
  tallaCm: { min: 120, max: 220, mensaje: 'La talla debe estar entre 120 y 220 cm.' },
  glucosa: { min: 40, max: 400, mensaje: 'La glucosa debe estar entre 40 y 400 mg/dL.' },
  presion: { min: 30, max: 140, mensaje: 'La presión diastólica debe estar entre 30 y 140 mmHg.' },
  pliegue: { min: 5, max: 100, mensaje: 'El pliegue cutáneo debe estar entre 5 y 100 mm.' },
  insulina: { min: 10, max: 900, mensaje: 'La insulina debe estar entre 10 y 900 µU/mL.' },
  imc: { min: 12, max: 70, mensaje: 'El IMC debe estar entre 12 y 70 kg/m².' },
  pedigree: { min: 0.05, max: 2.5, mensaje: 'El antecedente familiar debe estar entre 0,05 y 2,5.' },
};

/** Devuelve el mensaje de error o null si el valor es válido. */
export function validar(campo: string, valor: unknown, opcional = false): string | null {
  if (valor === null || valor === undefined || valor === '') {
    return opcional ? null : 'Este dato es obligatorio.';
  }
  const n = Number(valor);
  const r = RANGOS[campo];
  if (!Number.isFinite(n) || n < r.min || n > r.max) return r.mensaje;
  if ((campo === 'edad' || campo === 'embarazos') && !Number.isInteger(n)) {
    return 'Debe ser un número entero.';
  }
  return null;
}
