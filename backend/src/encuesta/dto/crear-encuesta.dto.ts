import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, Min, ValidateNested } from 'class-validator';
import { RespuestaItemDto } from './respuesta-item.dto';

export class CrearEncuestaDto {
  @IsInt()
  @Min(1)
  idEvaluacion!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RespuestaItemDto)
  respuestas!: RespuestaItemDto[];
}
