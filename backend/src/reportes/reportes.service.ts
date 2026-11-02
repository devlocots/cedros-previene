import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface ReporteClinicoCompleto {
  idEvaluacion: number;
  codigoAnonimo: string;
  sexo: string;
  canal: string;
  fechaRegistro: string;
  edad: number;
  embarazos: number;
  glucosa: number | null;
  presionDiastolica: number | null;
  pliegueCutaneo: number | null;
  insulina: number | null;
  pesoKg: number | null;
  tallaCm: number | null;
  imc: number;
  antecedenteFamiliar: string | null;
  pedigreeDiabetes: number;
  camposImputados: string[];
  probabilidad: number;
  nivelRiesgo: string;
  tiempoRespuestaMs: number;
  fechaEvaluacion: string;
  versionModelo: string;
  algoritmoModelo: string;
  evaluador: string | null;
  rolEvaluador: string | null;
  factores: {
    variable: string;
    valor: number | null;
    contribucion: number;
    orden: number;
  }[];
}

@Injectable()
export class ReportesService {
  constructor(private readonly db: DatabaseService) {}

  async obtenerReporte(idEvaluacion: number, idUsuario: number | null, ip: string | null): Promise<ReporteClinicoCompleto> {
    const [evaluacion] = await this.db.query<any>(
      `SELECT e.id_evaluacion, p.codigo_anonimo, p.sexo, p.canal, p.fecha_registro,
              r.edad, r.embarazos, r.glucosa, r.presion_diastolica, r.pliegue_cutaneo,
              r.insulina, r.peso_kg, r.talla_cm, r.imc, r.antecedente_familiar,
              r.pedigree_diabetes, r.campos_imputados,
              e.probabilidad, e.nivel_riesgo, e.tiempo_respuesta_ms, e.fecha_hora,
              m.version AS version_modelo, m.algoritmo,
              u.nombres AS evaluador, rol.nombre AS rol_evaluador
         FROM evaluacion_riesgo e
         JOIN registro_clinico r ON r.id_registro = e.id_registro
         JOIN participante p ON p.id_participante = r.id_participante
         JOIN modelo_ml m ON m.id_modelo = e.id_modelo
         LEFT JOIN usuario u ON u.id_usuario = e.id_usuario
         LEFT JOIN rol ON rol.id_rol = u.id_rol
        WHERE e.id_evaluacion = ?`,
      [idEvaluacion],
    );

    if (!evaluacion) {
      throw new NotFoundException(`La evaluación #${idEvaluacion} no existe.`);
    }

    const factores = await this.db.query<any>(
      `SELECT variable, valor, contribucion, orden
         FROM factor_influyente
        WHERE id_evaluacion = ?
        ORDER BY orden ASC`,
      [idEvaluacion],
    );

    // HU11: Registrar en bitácora la descarga del reporte clínico
    if (idUsuario) {
      await this.db.execute(
        'INSERT INTO bitacora_acceso (id_usuario, accion, ip) VALUES (?, ?, ?)',
        [idUsuario, 'DESCARGAR_REPORTE', ip],
      );
    }

    const imputados = evaluacion.campos_imputados ? evaluacion.campos_imputados.split(',') : [];

    return {
      idEvaluacion: evaluacion.id_evaluacion,
      codigoAnonimo: evaluacion.codigo_anonimo,
      sexo: evaluacion.sexo,
      canal: evaluacion.canal,
      fechaRegistro: evaluacion.fecha_registro,
      edad: evaluacion.edad,
      embarazos: evaluacion.embarazos,
      glucosa: evaluacion.glucosa !== null ? Number(evaluacion.glucosa) : null,
      presionDiastolica: evaluacion.presion_diastolica !== null ? Number(evaluacion.presion_diastolica) : null,
      pliegueCutaneo: evaluacion.pliegue_cutaneo !== null ? Number(evaluacion.pliegue_cutaneo) : null,
      insulina: evaluacion.insulina !== null ? Number(evaluacion.insulina) : null,
      pesoKg: evaluacion.peso_kg !== null ? Number(evaluacion.peso_kg) : null,
      tallaCm: evaluacion.talla_cm !== null ? Number(evaluacion.talla_cm) : null,
      imc: Number(evaluacion.imc),
      antecedenteFamiliar: evaluacion.antecedente_familiar,
      pedigreeDiabetes: Number(evaluacion.pedigree_diabetes),
      camposImputados: imputados,
      probabilidad: Number(evaluacion.probabilidad),
      nivelRiesgo: evaluacion.nivel_riesgo,
      tiempoRespuestaMs: evaluacion.tiempo_respuesta_ms,
      fechaEvaluacion: evaluacion.fecha_hora,
      versionModelo: evaluacion.version_modelo,
      algoritmoModelo: evaluacion.algoritmo,
      evaluador: evaluacion.evaluador,
      rolEvaluador: evaluacion.rol_evaluador,
      factores: factores.map((f: any) => ({
        variable: f.variable,
        valor: f.valor !== null ? Number(f.valor) : null,
        contribucion: Number(f.contribucion),
        orden: f.orden,
      })),
    };
  }
}
