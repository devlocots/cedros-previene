import { NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ReportesService } from './reportes.service';

describe('ReportesService', () => {
  let service: ReportesService;
  let fakeDb: Partial<DatabaseService>;

  beforeEach(() => {
    fakeDb = {
      query: jest.fn(),
      execute: jest.fn(),
    };
    service = new ReportesService(fakeDb as DatabaseService);
  });

  it('debe lanzar NotFoundException si la evaluación no existe', async () => {
    (fakeDb.query as jest.Mock).mockResolvedValueOnce([]);
    await expect(service.obtenerReporte(999, 1, '127.0.0.1')).rejects.toThrow(NotFoundException);
  });

  it('debe devolver el reporte completo y registrar auditoría', async () => {
    (fakeDb.query as jest.Mock)
      .mockResolvedValueOnce([
        {
          id_evaluacion: 2,
          codigo_anonimo: 'P-000002',
          sexo: 'F',
          canal: 'Tamizaje asistido',
          fecha_registro: '2026-10-12',
          edad: 45,
          embarazos: 2,
          glucosa: 110,
          presion_diastolica: 75,
          pliegue_cutaneo: 25,
          insulina: 120,
          peso_kg: 68,
          talla_cm: 160,
          imc: 26.6,
          antecedente_familiar: 'Uno',
          pedigree_diabetes: 0.55,
          campos_imputados: 'insulina',
          probabilidad: 0.25,
          nivel_riesgo: 'Moderado',
          tiempo_respuesta_ms: 45,
          fecha_hora: '2026-10-12 10:00:00',
          version_modelo: 'provisional-v0',
          algoritmo: 'Regresión Logística',
          evaluador: 'Dr. Mendoza',
          rol_evaluador: 'Médico',
        },
      ])
      .mockResolvedValueOnce([
        { variable: 'glucosa', valor: 110, contribucion: 0.12, orden: 1 },
      ]);

    const res = await service.obtenerReporte(2, 1, '127.0.0.1');

    expect(res.idEvaluacion).toBe(2);
    expect(res.codigoAnonimo).toBe('P-000002');
    expect(res.nivelRiesgo).toBe('Moderado');
    expect(res.factores.length).toBe(1);
    expect(fakeDb.execute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO bitacora_acceso'),
      [1, 'DESCARGAR_REPORTE', '127.0.0.1'],
    );
  });
});
