import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EvaluacionPersonalDto } from './dto/evaluacion-personal.dto';
import { EvaluacionPublicaDto } from './dto/evaluacion-publica.dto';
import { EvaluacionesService } from './evaluaciones.service';

@ApiTags('Evaluaciones')
@Controller('evaluaciones')
export class EvaluacionesController {
  constructor(private readonly service: EvaluacionesService) {}

  /** Test público: no requiere iniciar sesión. */
  @Post('publica')
  publica(@Body() dto: EvaluacionPublicaDto) {
    return this.service.evaluarPublica(dto);
  }

  /** Evaluación registrada por el personal de salud. */
  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  personal(@Body() dto: EvaluacionPersonalDto, @Req() req: any) {
    return this.service.evaluarPersonal(dto, req.user.sub);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  historial(@Query('nivel') nivel?: string, @Query('limite') limite?: string) {
    return this.service.historial(nivel, Number(limite ?? 100));
  }

  @Get('resumen')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  resumen() {
    return this.service.resumen();
  }
}
