import { Body, Controller, Get, HttpCode, Ip, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** HU10: inicio de sesión del personal de salud. */
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto, @Ip() ip: string) {
    return this.auth.login(dto.correo, dto.password, ip ?? null);
  }

  @Get('perfil')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  perfil(@Req() req: any) {
    return req.user;
  }
}
