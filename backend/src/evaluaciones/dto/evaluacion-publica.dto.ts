import { Equals, IsBoolean, IsIn, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export const ANTECEDENTES = ['Ninguno', 'Lejano', 'Uno', 'Dos o más'] as const;
export type Antecedente = (typeof ANTECEDENTES)[number];

/** Datos del test público (HU12). Rangos fisiológicos según HU02. */
export class EvaluacionPublicaDto {
  @IsIn(['F', 'M'], { message: 'El sexo debe ser F o M.' })
  sexo!: 'F' | 'M';

  @IsInt({ message: 'La edad debe ser un número entero.' })
  @Min(18, { message: 'La edad debe estar entre 18 y 100 años.' })
  @Max(100, { message: 'La edad debe estar entre 18 y 100 años.' })
  edad!: number;

  @IsOptional()
  @IsInt({ message: 'Los embarazos deben ser un número entero.' })
  @Min(0, { message: 'Los embarazos deben estar entre 0 y 20.' })
  @Max(20, { message: 'Los embarazos deben estar entre 0 y 20.' })
  embarazos?: number;

  @IsNumber({}, { message: 'El peso debe ser un número.' })
  @Min(30, { message: 'El peso debe estar entre 30 y 250 kg.' })
  @Max(250, { message: 'El peso debe estar entre 30 y 250 kg.' })
  pesoKg!: number;

  @IsNumber({}, { message: 'La talla debe ser un número.' })
  @Min(120, { message: 'La talla debe estar entre 120 y 220 cm.' })
  @Max(220, { message: 'La talla debe estar entre 120 y 220 cm.' })
  tallaCm!: number;

  @IsIn(ANTECEDENTES as unknown as string[], { message: 'Elija una opción de antecedentes familiares.' })
  antecedenteFamiliar!: Antecedente;

  @IsOptional()
  @IsNumber({}, { message: 'La presión debe ser un número.' })
  @Min(30, { message: 'La presión diastólica debe estar entre 30 y 140 mmHg.' })
  @Max(140, { message: 'La presión diastólica debe estar entre 30 y 140 mmHg.' })
  presion?: number | null;

  @IsOptional()
  @IsNumber({}, { message: 'La glucosa debe ser un número.' })
  @Min(40, { message: 'La glucosa debe estar entre 40 y 400 mg/dL.' })
  @Max(400, { message: 'La glucosa debe estar entre 40 y 400 mg/dL.' })
  glucosa?: number | null;

  @IsBoolean()
  @Equals(true, { message: 'Debe aceptar el consentimiento para continuar.' })
  consentimiento!: boolean;
}
