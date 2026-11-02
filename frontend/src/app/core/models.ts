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

export interface IndicadorCatalogo {
  indicador: string;
  pregunta: string;
  descripcion: string;
}

export interface DimensionCatalogo {
  dimension: 'Adecuación funcional' | 'Eficiencia de desempeño' | 'Capacidad de interacción' | 'Seguridad';
  indicadores: IndicadorCatalogo[];
}

export interface RespuestaItem {
  dimension: string;
  indicador: string;
  puntaje: number;
}

export interface ResumenEncuesta {
  global: {
    promedioGeneral: number | null;
    totalEvaluaciones: number;
    totalRespuestas: number;
  };
  porDimension: {
    dimension: string;
    promedio: number;
    total: number;
  }[];
  porIndicador: {
    dimension: string;
    indicador: string;
    promedio: number;
    total: number;
  }[];
  distribucion: {
    puntaje: number;
    cantidad: number;
  }[];
}

export interface Rol {
  idRol: number;
  nombre: string;
  descripcion: string;
}

export interface UsuarioAdmin {
  idUsuario: number;
  nombres: string;
  correo: string;
  idRol: number;
  rol: string;
  activo: boolean;
  fechaCreacion: string;
  ultimoAcceso: string | null;
}

export interface EntradaBitacora {
  idBitacora: number;
  idUsuario: number;
  usuario: string;
  rol: string;
  accion: string;
  ip: string | null;
  fechaHora: string;
}

export interface ReporteClinico {
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
  nivelRiesgo: Nivel;
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


