import { Controller, Get, Ip, Param, ParseIntPipe, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportesService } from './reportes.service';

@ApiTags('Reportes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reportes')
export class ReportesController {
  constructor(private readonly service: ReportesService) {}

  @Get('evaluacion/:id')
  @ApiOperation({ summary: 'Obtener datos completos del reporte clínico y auditar descarga (HU11)' })
  obtenerReporte(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    return this.service.obtenerReporte(id, req.user?.sub ?? null, ip ?? null);
  }
}
