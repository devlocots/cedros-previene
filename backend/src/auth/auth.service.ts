import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { DatabaseService } from '../database/database.service';
import { UsuarioToken } from './jwt-auth.guard';

interface FilaUsuario {
  id_usuario: number;
  nombres: string;
  correo: string;
  password_hash: string;
  rol: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwt: JwtService,
  ) {}

  async login(correo: string, password: string, ip: string | null) {
    const [usuario] = await this.db.query<FilaUsuario>(
      `SELECT u.id_usuario, u.nombres, u.correo, u.password_hash, r.nombre AS rol
         FROM usuario u JOIN rol r ON r.id_rol = u.id_rol
        WHERE u.correo = ? AND u.activo = TRUE`,
      [correo.trim().toLowerCase()],
    );
    const valido = usuario ? await bcrypt.compare(password, usuario.password_hash) : false;
    if (!usuario || !valido) {
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
    }

    await this.db.execute('UPDATE usuario SET ultimo_acceso = NOW() WHERE id_usuario = ?', [usuario.id_usuario]);
    await this.db.execute('INSERT INTO bitacora_acceso (id_usuario, accion, ip) VALUES (?, ?, ?)', [
      usuario.id_usuario,
      'LOGIN',
      ip,
    ]);

    const payload: UsuarioToken = {
      sub: usuario.id_usuario,
      correo: usuario.correo,
      nombres: usuario.nombres,
      rol: usuario.rol,
    };
    return {
      token: await this.jwt.signAsync(payload),
      usuario: { id: usuario.id_usuario, nombres: usuario.nombres, correo: usuario.correo, rol: usuario.rol },
    };
  }
}
