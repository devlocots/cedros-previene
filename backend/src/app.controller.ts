import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from './database/database.service';
import { MlService } from './ml/ml.service';

@Controller()
export class AppController {
  constructor(
    private readonly db: DatabaseService,
    private readonly ml: MlService,
  ) {}

  /** Estado de la API, la base de datos y el servicio de ML. */
  @Get('health')
  async health() {
    let baseDatos = 'ok';
    try {
      await this.db.query('SELECT 1');
    } catch (e) {
      baseDatos = `error: ${(e as Error).message}`;
    }
    const ml = await this.ml.health();
    return { api: 'ok', baseDatos, ml };
  }
}
