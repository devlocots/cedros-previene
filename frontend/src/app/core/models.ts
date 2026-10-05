export type Nivel = 'Bajo' | 'Moderado' | 'Alto';

export interface Factor {
  variable: string;
  nombre: string;
  valor: number;
  contribucion: number;
  imputado: boolean;
  orden: number;
}

export interface ResultadoEvaluacion {
  idEvaluacion: number;
  codigo: string;
  probabilidad: number;
  nivel: Nivel;
  umbrales: { moderado: number; alto: number };
  imc: number;
  imputados: string[];
  factores: Factor[];
  modelo: string;
  tiempoMs: number;
  fechaHora: string;
}

export interface Usuario {
  id: number;
  nombres: string;
  correo: string;
  rol: string;
}

export interface FilaHistorial {
  idEvaluacion: number;
  codigo: string;
  canal: string;
  sexo: string;
  edad: number;
  imc: number;
  glucosa: number | null;
  probabilidad: number;
  nivel: Nivel;
  tiempoMs: number;
  fechaHora: string;
  registradoPor: string;
}

export interface Resumen {
  total: number;
  porNivel: Record<Nivel, number>;
}
