import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface UsuarioToken {
  sub: number;
  correo: string;
  nombres: string;
  rol: string;
}

/** Protege rutas del panel: exige un token JWT válido en el encabezado Authorization. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const [tipo, token] = (req.headers['authorization'] ?? '').split(' ');
    if (tipo !== 'Bearer' || !token) {
      throw new UnauthorizedException('Inicie sesión para continuar.');
    }
    try {
      req.user = await this.jwt.verifyAsync<UsuarioToken>(token);
      return true;
    } catch {
      throw new UnauthorizedException('Su sesión expiró. Inicie sesión de nuevo.');
    }
  }
}
