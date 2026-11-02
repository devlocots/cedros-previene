import { NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CATALOGO_ISO25010 } from './catalogo';
import { EncuestaService } from './encuesta.service';

describe('EncuestaService', () => {
  let service: EncuestaService;
  let fakeDb: Partial<DatabaseService>;

  beforeEach(() => {
    fakeDb = {
      query: jest.fn(),
      execute: jest.fn(),
      transaction: jest.fn(async (fn: any) => {
        return fn({ execute: jest.fn() });
      }),
    };
    service = new EncuestaService(fakeDb as DatabaseService);
  });

  it('debe devolver el catálogo ISO/IEC 25010 con 4 dimensiones y 12 indicadores', () => {
    const cat = service.catalogo();
    expect(cat.length).toBe(4);
    const totalIndicadores = cat.reduce((acc, d) => acc + d.indicadores.length, 0);
    expect(totalIndicadores).toBe(12);
    expect(cat.map((d) => d.dimension)).toEqual([
      'Adecuación funcional',
      'Eficiencia de desempeño',
      'Capacidad de interacción',
      'Seguridad',
    ]);
  });

  it('debe lanzar NotFoundException si la evaluación no existe', async () => {
    (fakeDb.query as jest.Mock).mockResolvedValueOnce([]);
    await expect(
      service.guardar({
        idEvaluacion: 999,
        respuestas: [
          {
            dimension: 'Adecuación funcional',
            indicador: 'Completitud funcional',
            puntaje: 5,
          },
        ],
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('debe guardar respuestas satisfactoriamente si la evaluación existe', async () => {
    (fakeDb.query as jest.Mock).mockResolvedValueOnce([{ id_evaluacion: 1 }]);
    const res = await service.guardar({
      idEvaluacion: 1,
      respuestas: [
        {
          dimension: 'Adecuación funcional',
          indicador: 'Completitud funcional',
          puntaje: 5,
        },
        {
          dimension: 'Seguridad',
          indicador: 'Confidencialidad',
          puntaje: 4,
        },
      ],
    });
    expect(res.guardado).toBe(true);
    expect(res.idEvaluacion).toBe(1);
    expect(res.totalRespuestas).toBe(2);
  });

  it('debe devolver el resumen con promedios y estructura adecuada', async () => {
    (fakeDb.query as jest.Mock)
      .mockResolvedValueOnce([{ promedioGeneral: 4.5, totalEvaluaciones: 10, totalRespuestas: 120 }])
      .mockResolvedValueOnce([
        { dimension: 'Adecuación funcional', promedio: 4.8, total: 30 },
        { dimension: 'Seguridad', promedio: 4.2, total: 30 },
      ])
      .mockResolvedValueOnce([
        { dimension: 'Adecuación funcional', indicador: 'Completitud funcional', promedio: 4.9, total: 10 },
      ])
      .mockResolvedValueOnce([
        { puntaje: 4, cantidad: 40 },
        { puntaje: 5, cantidad: 80 },
      ]);

    const res = await service.resumen();
    expect(res.global.promedioGeneral).toBe(4.5);
    expect(res.global.totalEvaluaciones).toBe(10);
    expect(res.porDimension.length).toBe(2);
    expect(res.distribucion.length).toBe(5);
  });
});
