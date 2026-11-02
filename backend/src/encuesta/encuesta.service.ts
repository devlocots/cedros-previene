import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PoolConnection, ResultSetHeader } from 'mysql2/promise';
import { DatabaseService } from '../database/database.service';
import { CATALOGO_ISO25010 } from './catalogo';
import { CrearEncuestaDto } from './dto/crear-encuesta.dto';

export interface PromedioDimension {
  dimension: string;
  promedio: number;
  total: number;
}

export interface PromedioIndicador {
  dimension: string;
  indicador: string;
  promedio: number;
  total: number;
}

@Injectable()
export class EncuestaService {
  constructor(private readonly db: DatabaseService) {}

  catalogo() {
    return CATALOGO_ISO25010;
  }

  async guardar(dto: CrearEncuestaDto) {
    const [evaluacion] = await this.db.query<{ id_evaluacion: number }>(
      'SELECT id_evaluacion FROM evaluacion_riesgo WHERE id_evaluacion = ?',
      [dto.idEvaluacion],
    );
    if (!evaluacion) {
      throw new NotFoundException(`La evaluación #${dto.idEvaluacion} no existe.`);
    }

    await this.db.transaction(async (conn: PoolConnection) => {
      // Si ya existían respuestas previas para esta evaluación, las reemplazamos
      await conn.execute('DELETE FROM encuesta_calidad WHERE id_evaluacion = ?', [dto.idEvaluacion]);

      for (const r of dto.respuestas) {
        await conn.execute<ResultSetHeader>(
          `INSERT INTO encuesta_calidad (id_evaluacion, dimension, indicador, puntaje)
           VALUES (?, ?, ?, ?)`,
          [dto.idEvaluacion, r.dimension, r.indicador, r.puntaje],
        );
      }
    });

    return {
      guardado: true,
      idEvaluacion: dto.idEvaluacion,
      totalRespuestas: dto.respuestas.length,
      fechaHora: new Date().toISOString(),
    };
  }

  async obtenerPorEvaluacion(idEvaluacion: number) {
    const respuestas = await this.db.query<{
      id_respuesta: number;
      id_evaluacion: number;
      dimension: string;
      indicador: string;
      puntaje: number;
      fecha_hora: string;
    }>(
      'SELECT id_respuesta, id_evaluacion, dimension, indicador, puntaje, fecha_hora FROM encuesta_calidad WHERE id_evaluacion = ? ORDER BY id_respuesta ASC',
      [idEvaluacion],
    );
    return respuestas;
  }

  async resumen() {
    const [global] = await this.db.query<{
      promedioGeneral: number | null;
      totalEvaluaciones: number;
      totalRespuestas: number;
    }>(
      `SELECT
         ROUND(AVG(puntaje), 2) AS promedioGeneral,
         COUNT(DISTINCT id_evaluacion) AS totalEvaluaciones,
         COUNT(*) AS totalRespuestas
       FROM encuesta_calidad`,
    );

    const porDimension = await this.db.query<{
      dimension: string;
      promedio: number;
      total: number;
    }>(
      `SELECT
         dimension,
         ROUND(AVG(puntaje), 2) AS promedio,
         COUNT(*) AS total
       FROM encuesta_calidad
       GROUP BY dimension
       ORDER BY FIELD(dimension, 'Adecuación funcional', 'Eficiencia de desempeño', 'Capacidad de interacción', 'Seguridad')`,
    );

    const porIndicador = await this.db.query<{
      dimension: string;
      indicador: string;
      promedio: number;
      total: number;
    }>(
      `SELECT
         dimension,
         indicador,
         ROUND(AVG(puntaje), 2) AS promedio,
         COUNT(*) AS total
       FROM encuesta_calidad
       GROUP BY dimension, indicador
       ORDER BY FIELD(dimension, 'Adecuación funcional', 'Eficiencia de desempeño', 'Capacidad de interacción', 'Seguridad'), indicador ASC`,
    );

    const distribucion = await this.db.query<{ puntaje: number; cantidad: number }>(
      `SELECT puntaje, COUNT(*) AS cantidad
       FROM encuesta_calidad
       GROUP BY puntaje
       ORDER BY puntaje ASC`,
    );

    // Mapear distribución a array de 1 a 5 con ceros si no hay
    const distMap = new Map<number, number>();
    for (const d of distribucion) distMap.set(Number(d.puntaje), Number(d.cantidad));
    const escala = [1, 2, 3, 4, 5].map((pts) => ({
      puntaje: pts,
      cantidad: distMap.get(pts) ?? 0,
    }));

    return {
      global: {
        promedioGeneral: global?.promedioGeneral !== null ? Number(global?.promedioGeneral ?? 0) : null,
        totalEvaluaciones: Number(global?.totalEvaluaciones ?? 0),
        totalRespuestas: Number(global?.totalRespuestas ?? 0),
      },
      porDimension: porDimension.map((d) => ({
        dimension: d.dimension,
        promedio: Number(d.promedio),
        total: Number(d.total),
      })),
      porIndicador: porIndicador.map((i) => ({
        dimension: i.dimension,
        indicador: i.indicador,
        promedio: Number(i.promedio),
        total: Number(i.total),
      })),
      distribucion: escala,
    };
  }
}
