import { IsIn, IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class RespuestaItemDto {
  @IsString()
  @IsIn(['Adecuación funcional', 'Eficiencia de desempeño', 'Capacidad de interacción', 'Seguridad'])
  dimension!: 'Adecuación funcional' | 'Eficiencia de desempeño' | 'Capacidad de interacción' | 'Seguridad';

  @IsString()
  @IsNotEmpty()
  indicador!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  puntaje!: number;
}
