import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mysql from 'mysql2/promise';

/** Acceso a MySQL con consultas parametrizadas (evita inyección SQL). */
@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  readonly pool: mysql.Pool;

  constructor(config: ConfigService) {
    const ssl = config.get<string>('DB_SSL') === 'true' ? { rejectUnauthorized: false } : undefined;
    this.pool = mysql.createPool({
      host: config.get<string>('DB_HOST', 'localhost'),
      port: Number(config.get<string>('DB_PORT', '3306')),
      user: config.get<string>('DB_USER', 'root'),
      password: config.get<string>('DB_PASSWORD', ''),
      database: config.get<string>('DB_NAME', 'cedros_previene'),
      waitForConnections: true,
      connectionLimit: 10,
      decimalNumbers: true,
      timezone: 'local',
      ssl,
    });
    this.logger.log('Pool de conexiones a MySQL creado');
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const [rows] = await this.pool.query(sql, params);
    return rows as T[];
  }

  async execute(sql: string, params: any[] = []): Promise<mysql.ResultSetHeader> {
    const [result] = await this.pool.execute(sql, params);
    return result as mysql.ResultSetHeader;
  }

  /** Ejecuta varias operaciones en una sola transacción. */
  async transaction<T>(fn: (conn: mysql.PoolConnection) => Promise<T>): Promise<T> {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const result = await fn(conn);
      await conn.commit();
      return result;
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
