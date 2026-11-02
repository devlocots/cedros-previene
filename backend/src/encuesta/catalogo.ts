export interface IndicadorCatalogo {
  indicador: string;
  pregunta: string;
  descripcion: string;
}

export interface DimensionCatalogo {
  dimension: 'Adecuación funcional' | 'Eficiencia de desempeño' | 'Capacidad de interacción' | 'Seguridad';
  indicadores: IndicadorCatalogo[];
}

export const CATALOGO_ISO25010: DimensionCatalogo[] = [
  {
    dimension: 'Adecuación funcional',
    indicadores: [
      {
        indicador: 'Completitud funcional',
        pregunta: '¿El software cubre todas las tareas y funciones necesarias para la estimación del riesgo?',
        descripcion: 'Grado en que el conjunto de funcionalidades cubre todas las tareas y objetivos especificados.',
      },
      {
        indicador: 'Corrección funcional',
        pregunta: '¿Los resultados, cálculos y niveles de riesgo generados son correctos y precisos?',
        descripcion: 'Capacidad del sistema para proveer resultados correctos con la precisión requerida.',
      },
      {
        indicador: 'Pertinencia funcional',
        pregunta: '¿Las funciones y recomendaciones provistas son pertinentes para el tamizaje de diabetes?',
        descripcion: 'Grado en que las funciones facilitan la consecución de las metas del personal de salud.',
      },
    ],
  },
  {
    dimension: 'Eficiencia de desempeño',
    indicadores: [
      {
        indicador: 'Tiempo de respuesta',
        pregunta: '¿El tiempo que tarda el sistema en procesar y entregar el resultado es rápido y adecuado?',
        descripcion: 'Tiempos de respuesta y procesamiento del sistema al ejecutar una estimación.',
      },
      {
        indicador: 'Utilización de recursos',
        pregunta: '¿El software opera de forma ligera sin sobrecargar el equipo o navegador?',
        descripcion: 'Cantidad y tipos de recursos utilizados cuando el software ejecuta sus funciones.',
      },
      {
        indicador: 'Capacidad',
        pregunta: '¿El sistema mantiene un rendimiento óptimo al registrar múltiples evaluaciones consecutivas?',
        descripcion: 'Límites máximos de rendimiento del producto sin degradación del servicio.',
      },
    ],
  },
  {
    dimension: 'Capacidad de interacción',
    indicadores: [
      {
        indicador: 'Reconocibilidad de la adecuación',
        pregunta: '¿Es fácil comprender para qué sirve el sistema y si se adapta a sus necesidades clínicas?',
        descripcion: 'Facilidad de los usuarios para comprender si el software es adecuado para sus necesidades.',
      },
      {
        indicador: 'Aprendibilidad',
        pregunta: '¿Es sencillo aprender a utilizar el sistema y completar una evaluación sin ayuda?',
        descripcion: 'Facilidad con la que los usuarios pueden aprender a usar el sistema eficazmente.',
      },
      {
        indicador: 'Operabilidad',
        pregunta: '¿La interfaz es fácil de operar, intuitiva y minimiza la posibilidad de cometer errores?',
        descripcion: 'Facilidad con la que los usuarios pueden operar y controlar el sistema.',
      },
    ],
  },
  {
    dimension: 'Seguridad',
    indicadores: [
      {
        indicador: 'Confidencialidad',
        pregunta: '¿El sistema protege la privacidad del paciente al trabajar con códigos anónimos sin almacenar DNI ni nombres?',
        descripcion: 'Garantía de que la información está protegida conforme a la Ley N° 29733 de Datos Personales.',
      },
      {
        indicador: 'Integridad',
        pregunta: '¿El sistema previene accesos o modificaciones no autorizadas en las evaluaciones registradas?',
        descripcion: 'Protección contra alteraciones o eliminación no autorizada de datos clínicos.',
      },
      {
        indicador: 'Autenticidad',
        pregunta: '¿El mecanismo de inicio de sesión garantiza que solo el personal autorizado acceda al panel?',
        descripcion: 'Capacidad para verificar la identidad de los usuarios mediante credenciales y tokens seguros.',
      },
    ],
  },
];
