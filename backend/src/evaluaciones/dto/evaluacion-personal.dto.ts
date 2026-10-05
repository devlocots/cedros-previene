import { IsIn, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

/** Formulario del personal con las 8 variables del modelo (HU01, HU02). */
export class EvaluacionPersonalDto {
  @IsIn(['F', 'M'], { message: 'El sexo debe ser F o M.' })
  sexo!: 'F' | 'M';

  @IsInt({ message: 'La edad debe ser un número entero.' })
  @Min(18, { message: 'La edad debe estar entre 18 y 100 años.' })
  @Max(100, { message: 'La edad debe estar entre 18 y 100 años.' })
  edad!: number;

  @IsInt({ message: 'Los embarazos deben ser un número entero.' })
  @Min(0, { message: 'Los embarazos deben estar entre 0 y 20.' })
  @Max(20, { message: 'Los embarazos deben estar entre 0 y 20.' })
  embarazos!: number;

  @IsOptional()
  @IsNumber({}, { message: 'La glucosa debe ser un número.' })
  @Min(40, { message: 'La glucosa debe estar entre 40 y 400 mg/dL.' })
  @Max(400, { message: 'La glucosa debe estar entre 40 y 400 mg/dL.' })
  glucosa?: number | null;

  @IsOptional()
  @IsNumber({}, { message: 'La presión debe ser un número.' })
  @Min(30, { message: 'La presión diastólica debe estar entre 30 y 140 mmHg.' })
  @Max(140, { message: 'La presión diastólica debe estar entre 30 y 140 mmHg.' })
  presion?: number | null;

  @IsOptional()
  @IsNumber({}, { message: 'El pliegue cutáneo debe ser un número.' })
  @Min(5, { message: 'El pliegue cutáneo debe estar entre 5 y 100 mm.' })
  @Max(100, { message: 'El pliegue cutáneo debe estar entre 5 y 100 mm.' })
  pliegue?: number | null;

  @IsOptional()
  @IsNumber({}, { message: 'La insulina debe ser un número.' })
  @Min(10, { message: 'La insulina debe estar entre 10 y 900 µU/mL.' })
  @Max(900, { message: 'La insulina debe estar entre 10 y 900 µU/mL.' })
  insulina?: number | null;

  @IsNumber({}, { message: 'El IMC debe ser un número.' })
  @Min(12, { message: 'El IMC debe estar entre 12 y 70 kg/m².' })
  @Max(70, { message: 'El IMC debe estar entre 12 y 70 kg/m².' })
  imc!: number;

  @IsNumber({}, { message: 'El antecedente familiar debe ser un número.' })
  @Min(0.05, { message: 'El antecedente familiar debe estar entre 0,05 y 2,5.' })
  @Max(2.5, { message: 'El antecedente familiar debe estar entre 0,05 y 2,5.' })
  pedigree!: number;
}
