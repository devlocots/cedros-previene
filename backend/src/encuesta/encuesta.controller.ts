import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CrearEncuestaDto } from './dto/crear-encuesta.dto';
import { EncuestaService } from './encuesta.service';

@ApiTags('Encuesta Calidad ISO 25010')
@Controller('encuesta')
export class EncuestaController {
  constructor(private readonly service: EncuestaService) {}

  @Get('catalogo')
  @ApiOperation({ summary: 'Obtener dimensiones e indicadores de la norma ISO/IEC 25010' })
  catalogo() {
    return this.service.catalogo();
  }

  @Get('resumen')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Resumen de promedios por dimensión e indicador para la tesis (Variable X)' })
  resumen() {
    return this.service.resumen();
  }

  @Get('evaluacion/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener respuestas de encuesta para una evaluación específica' })
  porEvaluacion(@Param('id', ParseIntPipe) id: number) {
    return this.service.obtenerPorEvaluacion(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Registrar respuestas del cuestionario Likert ISO/IEC 25010' })
  guardar(@Body() dto: CrearEncuestaDto) {
    return this.service.guardar(dto);
  }
}
