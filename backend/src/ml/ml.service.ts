import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EntradaModelo {
  embarazos: number;
  glucosa: number | null;
  presion: number | null;
  pliegue: number | null;
  insulina: number | null;
  imc: number;
  pedigree: number;
  edad: number;
}

export interface FactorModelo {
  variable: string;
  nombre: string;
  valor: number;
  contribucion: number;
  imputado: boolean;
  orden: number;
}

export interface RespuestaModelo {
  probabilidad: number;
  imputados: string[];
  factores: FactorModelo[];
  version: string;
  tiempo_ms: number;
}

/** Medianas del Pima Indians Diabetes Dataset (valores válidos) para imputar datos faltantes. */
const MEDIANAS: Record<keyof EntradaModelo, number> = {
  embarazos: 3, glucosa: 117, presion: 72, pliegue: 29, insulina: 125, imc: 32.3, pedigree: 0.3725, edad: 29,
};
const NOMBRES: Record<keyof EntradaModelo, string> = {
  embarazos: 'Embarazos', glucosa: 'Glucosa', presion: 'Presión diastólica', pliegue: 'Pliegue cutáneo',
  insulina: 'Insulina', imc: 'IMC', pedigree: 'Antecedente familiar', edad: 'Edad',
};
const OPCIONALES: (keyof EntradaModelo)[] = ['glucosa', 'presion', 'pliegue', 'insulina'];

/**
 * Cliente HTTP del servicio de ML (FastAPI).
 * Si el servicio no está encendido y ML_FALLBACK no es "false", usa un modelo provisional
 * (regresión logística con coeficientes fijos) para que el sistema siga funcionando en el Sprint 1.
 */
@Injectable()
export class MlService {
  private readonly logger = new Logger(MlService.name);
  private readonly url: string;
  private readonly apiKey: string;
  private readonly usarProvisional: boolean;

  constructor(config: ConfigService) {
    this.url = (config.get<string>('ML_URL') ?? 'http://localhost:8000').replace(/\/$/, '');
    this.apiKey = config.get<string>('ML_API_KEY') ?? '';
    this.usarProvisional = config.get<string>('ML_FALLBACK') !== 'false';
  }

  async predecir(datos: EntradaModelo): Promise<RespuestaModelo> {
    let res: Response;
    try {
      res = await fetch(`${this.url}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': this.apiKey },
        body: JSON.stringify(datos),
        signal: AbortSignal.timeout(90_000), // en Render gratuito el servicio puede tardar en despertar
      });
    } catch (e) {
      this.logger.warn(`No se pudo conectar con el servicio de ML: ${(e as Error).message}`);
      if (this.usarProvisional) {
        return this.modeloProvisional(datos);
      }
      throw new ServiceUnavailableException(
        'El servicio de predicción no está disponible. Verifique que el servicio de ML esté encendido.',
      );
    }
    if (res.status === 422) {
      throw new BadRequestException('Los datos enviados al modelo no son válidos.');
    }
    if (!res.ok) {
      const detalle = await res.text();
      this.logger.error(`El servicio de ML respondió ${res.status}: ${detalle}`);
      throw new ServiceUnavailableException('El servicio de predicción respondió con un error.');
    }
    return (await res.json()) as RespuestaModelo;
  }

  /** Modelo provisional del Sprint 1: se reemplaza por el Random Forest del servicio de ML. */
  modeloProvisional(datos: EntradaModelo): RespuestaModelo {
    const inicio = Date.now();
    const imputados: string[] = [];
    const x = { ...datos } as Record<keyof EntradaModelo, number>;
    for (const k of OPCIONALES) {
      if (datos[k] === null || datos[k] === undefined) {
        x[k] = MEDIANAS[k];
        imputados.push(k);
      }
    }
    const prob = (v: Record<keyof EntradaModelo, number>) => {
      const z =
        -9.2 + 0.035 * v.glucosa + 0.09 * v.imc + 0.03 * v.edad + 0.12 * v.embarazos + 0.9 * v.pedigree +
        0.004 * (v.presion - 72) + 0.0015 * (v.insulina - 125);
      return 1 / (1 + Math.exp(-z));
    };
    const p = prob(x);
    const claves = Object.keys(MEDIANAS) as (keyof EntradaModelo)[];
    const factores: FactorModelo[] = claves
      .map((k) => ({
        variable: k,
        nombre: NOMBRES[k],
        valor: x[k],
        contribucion: imputados.includes(k) ? 0 : Math.round((p - prob({ ...x, [k]: MEDIANAS[k] })) * 10000) / 10000,
        imputado: imputados.includes(k),
        orden: 0,
      }))
      .sort((a, b) => Math.abs(b.contribucion) - Math.abs(a.contribucion))
      .map((f, i) => ({ ...f, orden: i + 1 }));
    return {
      probabilidad: Math.round(p * 10000) / 10000,
      imputados,
      factores,
      version: 'provisional-v0',
      tiempo_ms: Date.now() - inicio,
    };
  }

  async health(): Promise<any> {
    try {
      const res = await fetch(`${this.url}/health`, { signal: AbortSignal.timeout(10_000) });
      return await res.json();
    } catch {
      return { estado: 'no_disponible' };
    }
  }
}
