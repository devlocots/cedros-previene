import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { DatabaseService } from '../database/database.service';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';

export interface UsuarioDetalle {
  idUsuario: number;
  nombres: string;
  correo: string;
  idRol: number;
  rol: string;
  activo: boolean;
  fechaCreacion: string;
  ultimoAcceso: string | null;
}

export interface EntradaBitacora {
  idBitacora: number;
  idUsuario: number;
  usuario: string;
  rol: string;
  accion: string;
  ip: string | null;
  fechaHora: string;
}

@Injectable()
export class AdminService {
  constructor(private readonly db: DatabaseService) {}

  async listarRoles() {
    return this.db.query<{ id_rol: number; nombre: string; descripcion: string }>(
      'SELECT id_rol AS idRol, nombre, descripcion FROM rol ORDER BY id_rol ASC',
    );
  }

  async listarUsuarios(): Promise<UsuarioDetalle[]> {
    const filas = await this.db.query<{
      id_usuario: number;
      nombres: string;
      correo: string;
      id_rol: number;
      rol: string;
      activo: number;
      fecha_creacion: string;
      ultimo_acceso: string | null;
    }>(
      `SELECT u.id_usuario, u.nombres, u.correo, u.id_rol, r.nombre AS rol,
              u.activo, u.fecha_creacion, u.ultimo_acceso
         FROM usuario u
         JOIN rol r ON r.id_rol = u.id_rol
        ORDER BY u.id_usuario ASC`,
    );

    return filas.map((u) => ({
      idUsuario: u.id_usuario,
      nombres: u.nombres,
      correo: u.correo,
      idRol: u.id_rol,
      rol: u.rol,
      activo: Boolean(u.activo),
      fechaCreacion: u.fecha_creacion,
      ultimoAcceso: u.ultimo_acceso,
    }));
  }

  async crearUsuario(dto: CrearUsuarioDto) {
    const [existente] = await this.db.query<{ id_usuario: number }>(
      'SELECT id_usuario FROM usuario WHERE correo = ?',
      [dto.correo.trim().toLowerCase()],
    );
    if (existente) {
      throw new ConflictException('Ya existe un usuario registrado con este correo.');
    }

    const [rol] = await this.db.query<{ id_rol: number }>(
      'SELECT id_rol FROM rol WHERE id_rol = ?',
      [dto.idRol],
    );
    if (!rol) {
      throw new BadRequestException('El rol especificado no existe.');
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(dto.password, salt);

    const res = await this.db.execute(
      `INSERT INTO usuario (id_rol, nombres, correo, password_hash, activo)
       VALUES (?, ?, ?, ?, TRUE)`,
      [dto.idRol, dto.nombres.trim(), dto.correo.trim().toLowerCase(), hash],
    );

    return {
      creado: true,
      idUsuario: res.insertId,
      nombres: dto.nombres.trim(),
      correo: dto.correo.trim().toLowerCase(),
      idRol: dto.idRol,
    };
  }

  async toggleActivo(idUsuario: number, activo: boolean) {
    const [usuario] = await this.db.query<{ id_usuario: number }>(
      'SELECT id_usuario FROM usuario WHERE id_usuario = ?',
      [idUsuario],
    );
    if (!usuario) {
      throw new NotFoundException(`El usuario #${idUsuario} no existe.`);
    }

    await this.db.execute('UPDATE usuario SET activo = ? WHERE id_usuario = ?', [activo, idUsuario]);
    return { idUsuario, activo };
  }

  async listarBitacora(limite = 50): Promise<EntradaBitacora[]> {
    const filas = await this.db.query<{
      id_bitacora: number;
      id_usuario: number;
      usuario: string;
      rol: string;
      accion: string;
      ip: string | null;
      fecha_hora: string;
    }>(
      `SELECT b.id_bitacora, b.id_usuario, u.nombres AS usuario, r.nombre AS rol,
              b.accion, b.ip, b.fecha_hora
         FROM bitacora_acceso b
         JOIN usuario u ON u.id_usuario = b.id_usuario
         JOIN rol r ON r.id_rol = u.id_rol
        ORDER BY b.id_bitacora DESC
        LIMIT ?`,
      [limite],
    );

    return filas.map((b) => ({
      idBitacora: b.id_bitacora,
      idUsuario: b.id_usuario,
      usuario: b.usuario,
      rol: b.rol,
      accion: b.accion,
      ip: b.ip,
      fechaHora: b.fecha_hora,
    }));
  }
}
