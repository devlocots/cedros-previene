import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { DatabaseService } from '../database/database.service';
import { MlService } from '../ml/ml.service';

/** Al arrancar: crea los usuarios de prueba y registra el modelo activo si todavía no existen. */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly ml: MlService,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    try {
      await this.usuarios();
      await this.modelo();
    } catch (e) {
      this.logger.error(
        `No se pudo preparar la base de datos: ${(e as Error).message}. ` +
          '¿Está encendido MySQL y se ejecutó db/modelo_datos_mysql.sql?',
      );
    }
  }

  private async usuarios() {
    const [{ total }] = await this.db.query<{ total: number }>('SELECT COUNT(*) AS total FROM usuario');
    if (Number(total) > 0) return;

    const roles = await this.db.query<{ id_rol: number; nombre: string }>('SELECT id_rol, nombre FROM rol');
    const idRol = (nombre: string) => roles.find((r) => r.nombre === nombre)?.id_rol;
    const hash = await bcrypt.hash(this.config.get<string>('SEED_PASSWORD') ?? 'Cedros2026!', 10);
    const usuarios: [string, string, string][] = [
      ['Personal de tamizaje 1', 'tamizaje1@cedrosprevine.pe', 'Tamizaje'],
      ['Médico 1', 'medico1@cedrosprevine.pe', 'Médico'],
      ['Jefatura', 'jefatura@cedrosprevine.pe', 'Jefatura'],
      ['Administrador', 'admin@cedrosprevine.pe', 'Admin'],
    ];
    for (const [nombres, correo, rol] of usuarios) {
      const id = idRol(rol);
      if (!id) continue;
      await this.db.execute(
        'INSERT INTO usuario (id_rol, nombres, correo, password_hash) VALUES (?, ?, ?, ?)',
        [id, nombres, correo, hash],
      );
    }
    this.logger.log('Usuarios de prueba creados (contraseña: la de SEED_PASSWORD en .env)');
  }

  private async modelo() {
    const salud = await this.ml.health();
    const version: string = salud?.version ?? 'provisional-v0';
    const [activo] = await this.db.query<{ version: string }>('SELECT version FROM modelo_ml WHERE activo = TRUE LIMIT 1');
    if (activo?.version === version) return;
    const [existe] = await this.db.query('SELECT id_modelo FROM modelo_ml WHERE version = ?', [version]);
    await this.db.execute('UPDATE modelo_ml SET activo = FALSE');
    if (existe) {
      await this.db.execute('UPDATE modelo_ml SET activo = TRUE WHERE version = ?', [version]);
      return;
    }
    const m = salud?.metricas ?? {};
    await this.db.execute(
      `INSERT INTO modelo_ml (version, ruta_archivo, fecha_entrenamiento, sensibilidad, roc_auc, brier_score, activo)
       VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
      [
        version,
        salud?.version ? 'ml-service/artefactos/modelo_rf.joblib' : 'backend/src/ml/ml.service.ts (provisional)',
        m.fecha_entrenamiento ?? new Date().toISOString().slice(0, 10),
        m.sensibilidad ?? null,
        m.roc_auc ?? null,
        m.brier_score ?? null,
      ],
    );
    this.logger.log('Modelo activo registrado en la tabla modelo_ml');
  }
}
