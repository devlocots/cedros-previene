import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AdminService } from './admin.service';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';

@ApiTags('Administración')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly service: AdminService) {}

  @Get('roles')
  @ApiOperation({ summary: 'Listar roles del sistema (Admin)' })
  roles() {
    return this.service.listarRoles();
  }

  @Get('usuarios')
  @ApiOperation({ summary: 'Listar usuarios registrados del personal de salud (Admin)' })
  usuarios() {
    return this.service.listarUsuarios();
  }

  @Post('usuarios')
  @ApiOperation({ summary: 'Crear un nuevo usuario con credenciales y rol (Admin)' })
  crear(@Body() dto: CrearUsuarioDto) {
    return this.service.crearUsuario(dto);
  }

  @Patch('usuarios/:id/activo')
  @ApiOperation({ summary: 'Activar o desactivar un usuario (Admin)' })
  toggleActivo(
    @Param('id', ParseIntPipe) id: number,
    @Body('activo') activo: boolean,
  ) {
    return this.service.toggleActivo(id, Boolean(activo));
  }

  @Get('bitacora')
  @ApiOperation({ summary: 'Consultar la bitácora de auditoría y accesos (Admin)' })
  bitacora(@Query('limite') limite?: string) {
    return this.service.listarBitacora(Number(limite ?? 50));
  }
}
