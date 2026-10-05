import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PoolConnection, ResultSetHeader } from 'mysql2/promise';
import { DatabaseService } from '../database/database.service';
import { MlService } from '../ml/ml.service';
import { EvaluacionPersonalDto } from './dto/evaluacion-personal.dto';
import { Antecedente, EvaluacionPublicaDto } from './dto/evaluacion-publica.dto';

/** Conversión de la respuesta sobre familiares al índice de antecedente familiar del modelo.
 *  Valores iniciales: deben calibrarse con los datos del entrenamiento. */
export const PEDIGREE: Record<Antecedente, number> = {
  Ninguno: 0.2,
  Lejano: 0.35,
  Uno: 0.55,
  'Dos o más': 0.85,
};

const COLUMNA: Record<string, string> = {
  glucosa: 'glucosa',
  presion: 'presion_diastolica',
  pliegue: 'pliegue_cutaneo',
  insulina: 'insulina',
};

interface DatosRegistro {
  sexo: 'F' | 'M';
  canal: 'Autoevaluación web' | 'Tamizaje asistido';
  idUsuario: number | null;
  edad: number;
  embarazos: number;
  glucosa: number | null;
  presion: number | null;
  pliegue: number | null;
  insulina: number | null;
  imc: number;
  pedigree: number;
  pesoKg: number | null;
  tallaCm: number | null;
  antecedente: Antecedente | null;
}

const n = (v: number | null | undefined) => (v === undefined || v === null ? null : Number(v));

export function calcularImc(pesoKg: number, tallaCm: number): number {
  return Math.round((pesoKg / (tallaCm / 100) ** 2) * 10) / 10;
}

export function nivelDeRiesgo(p: number, umbralModerado: number, umbralAlto: number) {
  return p < umbralModerado ? 'Bajo' : p < umbralAlto ? 'Moderado' : 'Alto';
}

@Injectable()
export class EvaluacionesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly ml: MlService,
  ) {}

  /** HU12: test público (sin cuenta). */
  evaluarPublica(dto: EvaluacionPublicaDto) {
    const imc = calcularImc(dto.pesoKg, dto.tallaCm);
    if (imc < 12 || imc > 70) {
      throw new BadRequestException('El IMC calculado no es válido. Revise el peso y la talla.');
    }
    return this.evaluar({
      sexo: dto.sexo,
      canal: 'Autoevaluación web',
      idUsuario: null,
      edad: dto.edad,
      embarazos: dto.sexo === 'F' ? (dto.embarazos ?? 0) : 0,
      glucosa: n(dto.glucosa),
      presion: n(dto.presion),
      pliegue: null,
      insulina: null,
      imc,
      pedigree: PEDIGREE[dto.antecedenteFamiliar],
      pesoKg: dto.pesoKg,
      tallaCm: dto.tallaCm,
      antecedente: dto.antecedenteFamiliar,
    });
  }

  /** HU01–HU04: evaluación registrada por el personal de salud. */
  evaluarPersonal(dto: EvaluacionPersonalDto, idUsuario: number) {
    return this.evaluar({
      sexo: dto.sexo,
      canal: 'Tamizaje asistido',
      idUsuario,
      edad: dto.edad,
      embarazos: dto.sexo === 'F' ? dto.embarazos : 0,
      glucosa: n(dto.glucosa),
      presion: n(dto.presion),
      pliegue: n(dto.pliegue),
      insulina: n(dto.insulina),
      imc: dto.imc,
      pedigree: dto.pedigree,
      pesoKg: null,
      tallaCm: null,
      antecedente: null,
    });
  }

  private async modeloActivo() {
    const [modelo] = await this.db.query<{
      id_modelo: number;
      version: string;
      umbral_moderado: number;
      umbral_alto: number;
    }>('SELECT id_modelo, version, umbral_moderado, umbral_alto FROM modelo_ml WHERE activo = TRUE ORDER BY id_modelo DESC LIMIT 1');
    if (!modelo) {
      throw new InternalServerErrorException('No hay un modelo activo registrado en la base de datos.');
    }
    return modelo;
  }

  private async evaluar(d: DatosRegistro) {
    const inicio = Date.now();
    const modelo = await this.modeloActivo();

    // HU03 y HU04: el servicio de ML imputa lo que falta y calcula la probabilidad
    const r = await this.ml.predecir({
      embarazos: d.embarazos,
      glucosa: d.glucosa,
      presion: d.presion,
      pliegue: d.pliegue,
      insulina: d.insulina,
      imc: d.imc,
      pedigree: d.pedigree,
      edad: d.edad,
    });
    const nivel = nivelDeRiesgo(r.probabilidad, Number(modelo.umbral_moderado), Number(modelo.umbral_alto));
    const tiempoMs = Date.now() - inicio;
    const imputados = r.imputados.map((k) => COLUMNA[k] ?? k);

    const guardado = await this.db.transaction(async (conn: PoolConnection) => {
      const temporal = 'T' + Date.now().toString(36).slice(-8) + Math.floor(Math.random() * 999);
      const [part] = await conn.execute<ResultSetHeader>(
        `INSERT INTO participante (codigo_anonimo, sexo, canal, consentimiento, id_usuario_registro)
         VALUES (?, ?, ?, TRUE, ?)`,
        [temporal.slice(0, 12), d.sexo, d.canal, d.idUsuario],
      );
      const codigo = 'P-' + String(part.insertId).padStart(6, '0');
      await conn.execute('UPDATE participante SET codigo_anonimo = ? WHERE id_participante = ?', [
        codigo,
        part.insertId,
      ]);

      const [reg] = await conn.execute<ResultSetHeader>(
        `INSERT INTO registro_clinico
           (id_participante, embarazos, glucosa, presion_diastolica, pliegue_cutaneo, insulina,
            peso_kg, talla_cm, imc, antecedente_familiar, pedigree_diabetes, edad, campos_imputados)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          part.insertId, d.embarazos, d.glucosa, d.presion, d.pliegue, d.insulina,
          d.pesoKg, d.tallaCm, d.imc, d.antecedente, d.pedigree, d.edad,
          imputados.length ? imputados.join(',') : null,
        ],
      );

      const [ev] = await conn.execute<ResultSetHeader>(
        `INSERT INTO evaluacion_riesgo
           (id_registro, id_modelo, id_usuario, probabilidad, nivel_riesgo, tiempo_respuesta_ms)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [reg.insertId, modelo.id_modelo, d.idUsuario, r.probabilidad, nivel, tiempoMs],
      );

      for (const f of r.factores) {
        await conn.execute(
          `INSERT INTO factor_influyente (id_evaluacion, variable, valor, contribucion, orden)
           VALUES (?, ?, ?, ?, ?)`,
          [ev.insertId, f.variable, f.valor, f.contribucion, f.orden],
        );
      }
      if (d.idUsuario) {
        await conn.execute('INSERT INTO bitacora_acceso (id_usuario, accion) VALUES (?, ?)', [
          d.idUsuario,
          'EVALUAR',
        ]);
      }
      return { idEvaluacion: ev.insertId, codigo };
    });

    return {
      ...guardado,
      probabilidad: r.probabilidad,
      nivel,
      umbrales: { moderado: Number(modelo.umbral_moderado), alto: Number(modelo.umbral_alto) },
      imc: d.imc,
      imputados: r.imputados,
      factores: r.factores,
      modelo: r.version,
      tiempoMs,
      fechaHora: new Date().toISOString(),
    };
  }

  /** Historial de evaluaciones para el panel (HU07). */
  async historial(nivel?: string, limite = 100) {
    const params: any[] = [];
    let filtro = '';
    if (nivel && ['Bajo', 'Moderado', 'Alto'].includes(nivel)) {
      filtro = 'WHERE e.nivel_riesgo = ?';
      params.push(nivel);
    }
    params.push(Math.min(Math.max(Number(limite) || 100, 1), 500));
    return this.db.query(
      `SELECT e.id_evaluacion AS idEvaluacion, p.codigo_anonimo AS codigo, p.canal, p.sexo,
              r.edad, r.imc, r.glucosa, e.probabilidad, e.nivel_riesgo AS nivel,
              e.tiempo_respuesta_ms AS tiempoMs, e.fecha_hora AS fechaHora,
              COALESCE(u.nombres, '—') AS registradoPor
         FROM evaluacion_riesgo e
         JOIN registro_clinico r ON r.id_registro = e.id_registro
         JOIN participante p ON p.id_participante = r.id_participante
         LEFT JOIN usuario u ON u.id_usuario = e.id_usuario
         ${filtro}
        ORDER BY e.fecha_hora DESC, e.id_evaluacion DESC
        LIMIT ?`,
      params,
    );
  }

  async resumen() {
    const filas = await this.db.query<{ nivel: string; total: number }>(
      'SELECT nivel_riesgo AS nivel, COUNT(*) AS total FROM evaluacion_riesgo GROUP BY nivel_riesgo',
    );
    const porNivel = { Bajo: 0, Moderado: 0, Alto: 0 } as Record<string, number>;
    filas.forEach((f) => (porNivel[f.nivel] = Number(f.total)));
    const total = Object.values(porNivel).reduce((a, b) => a + b, 0);
    return { total, porNivel };
  }
}
