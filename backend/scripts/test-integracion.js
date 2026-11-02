/**
 * CEDROS PREVIENE - SUITE DE PRUEBAS DE INTEGRACIÓN (TIPO 2: INTEGRATION TESTING)
 * Rúbrica T2: Monitoreo Avance de Proyectos 02 - Semana 10
 *
 * Valida el flujo extremo a extremo entre los módulos:
 * Auth -> Evaluaciones -> MySQL -> Encuesta ISO 25010 -> Reportes -> Bitácora de Auditoría
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000/api';

const colores = {
  reset: '\x1b[0m',
  verde: '\x1b[32m',
  rojo: '\x1b[31m',
  amarillo: '\x1b[33m',
  azul: '\x1b[36m',
  bold: '\x1b[1m',
};

async function ejecutarPruebasIntegracion() {
  console.log(`\n${colores.bold}${colores.azul}======================================================================${colores.reset}`);
  console.log(`${colores.bold}${colores.azul}   CEDROS PREVIENE · PRUEBAS DE INTEGRACIÓN E2E (SEMANA 10)            ${colores.reset}`);
  console.log(`${colores.bold}${colores.azul}======================================================================${colores.reset}\n`);

  let pasadas = 0;
  let fallidas = 0;
  const inicioTotal = Date.now();

  async function test(nombre, fn) {
    process.stdout.write(`  [TEST] ${nombre.padEnd(60, '.')} `);
    const t0 = Date.now();
    try {
      await fn();
      const dt = Date.now() - t0;
      console.log(`${colores.verde}✔ PASS${colores.reset} (${dt}ms)`);
      pasadas++;
    } catch (err) {
      const dt = Date.now() - t0;
      console.log(`${colores.rojo}✘ FAIL${colores.reset} (${dt}ms)`);
      console.error(`         ${colores.rojo}Error: ${err.message}${colores.reset}`);
      fallidas++;
    }
  }

  function assert(condicion, mensaje) {
    if (!condicion) throw new Error(mensaje);
  }

  let tokenTamizaje = null;
  let tokenAdmin = null;
  let idEvaluacionCreada = null;
  let codigoAnonimo = null;

  // 1. Integración Auth: Login y emisión de token JWT
  await test('INT-01: Autenticación de personal de tamizaje y emisión de JWT', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: 'tamizaje1@cedrosprevine.pe', password: 'Cedros2026!' }),
    });
    assert(res.status === 200, `Status esperado 200, recibido ${res.status}`);
    const data = await res.json();
    assert(data.token, 'No se recibió token JWT');
    assert(data.usuario.rol === 'Tamizaje', `Rol esperado Tamizaje, recibido ${data.usuario.rol}`);
    tokenTamizaje = data.token;
  });

  // 2. Integración Auth: Login de Administrador
  await test('INT-02: Autenticación de Administrador y validación de rol', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: 'admin@cedrosprevine.pe', password: 'Cedros2026!' }),
    });
    assert(res.status === 200, `Status esperado 200, recibido ${res.status}`);
    const data = await res.json();
    assert(data.token, 'No se recibió token JWT');
    assert(data.usuario.rol === 'Admin', `Rol esperado Admin, recibido ${data.usuario.rol}`);
    tokenAdmin = data.token;
  });

  // 3. Integración Flujo Clínico: Registro asistido -> Inferencia ML -> Transacción MySQL
  await test('INT-03: Flujo clínico completo (Evaluación asistida + Inferencia + MySQL)', async () => {
    const payload = {
      sexo: 'F',
      edad: 48,
      embarazos: 2,
      glucosa: 135,
      presion: 85,
      pliegue: null, // opcional
      insulina: null, // opcional (imputada)
      imc: 29.4,
      pedigree: 0.55,
    };
    const res = await fetch(`${BASE_URL}/evaluaciones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenTamizaje}`,
      },
      body: JSON.stringify(payload),
    });
    assert(res.status === 201, `Status esperado 201, recibido ${res.status}`);
    const data = await res.json();
    assert(data.idEvaluacion > 0, 'No se generó idEvaluacion');
    assert(data.codigo && data.codigo.startsWith('P-'), 'Código anónimo no cumple formato P-XXXXXX');
    assert(typeof data.probabilidad === 'number' && data.probabilidad >= 0 && data.probabilidad <= 1, 'Probabilidad inválida');
    assert(['Bajo', 'Moderado', 'Alto'].includes(data.nivel), `Nivel de riesgo inválido: ${data.nivel}`);
    assert(Array.isArray(data.factores) && data.factores.length > 0, 'No se devolvieron factores explicativos');
    assert(data.imputados.includes('insulina'), 'La insulina no fue detectada como imputada');
    idEvaluacionCreada = data.idEvaluacion;
    codigoAnonimo = data.codigo;
  });

  // 4. Integración Historial: Consulta relacional en base de datos
  await test('INT-04: Consulta relacional de historial y verificación del registro', async () => {
    const res = await fetch(`${BASE_URL}/evaluaciones?limite=10`, {
      headers: { Authorization: `Bearer ${tokenTamizaje}` },
    });
    assert(res.status === 200, `Status esperado 200, recibido ${res.status}`);
    const data = await res.json();
    assert(Array.isArray(data), 'La respuesta debe ser una lista');
    const encontrado = data.find((e) => e.idEvaluacion === idEvaluacionCreada);
    assert(encontrado, `La evaluación #${idEvaluacionCreada} no se encontró en el historial`);
    assert(encontrado.codigo === codigoAnonimo, 'El código en historial no coincide');
  });

  // 5. Integración Encuesta Calidad: Registro ISO 25010 asociado a la evaluación
  await test('INT-05: Integración de Encuesta ISO 25010 vinculada a la evaluación clínica', async () => {
    const respuestas = [
      { dimension: 'Adecuación funcional', indicador: 'Completitud funcional', puntaje: 5 },
      { dimension: 'Adecuación funcional', indicador: 'Corrección funcional', puntaje: 5 },
      { dimension: 'Adecuación funcional', indicador: 'Pertinencia funcional', puntaje: 4 },
      { dimension: 'Eficiencia de desempeño', indicador: 'Tiempo de respuesta', puntaje: 5 },
      { dimension: 'Eficiencia de desempeño', indicador: 'Utilización de recursos', puntaje: 5 },
      { dimension: 'Eficiencia de desempeño', indicador: 'Capacidad', puntaje: 4 },
      { dimension: 'Capacidad de interacción', indicador: 'Reconocibilidad de la adecuación', puntaje: 5 },
      { dimension: 'Capacidad de interacción', indicador: 'Aprendibilidad', puntaje: 5 },
      { dimension: 'Capacidad de interacción', indicador: 'Operabilidad', puntaje: 5 },
      { dimension: 'Seguridad', indicador: 'Confidencialidad', puntaje: 5 },
      { dimension: 'Seguridad', indicador: 'Integridad', puntaje: 5 },
      { dimension: 'Seguridad', indicador: 'Autenticidad', puntaje: 5 },
    ];
    const res = await fetch(`${BASE_URL}/encuesta`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenTamizaje}`,
      },
      body: JSON.stringify({
        idEvaluacion: idEvaluacionCreada,
        respuestas,
      }),
    });
    assert(res.status === 201, `Status esperado 201, recibido ${res.status}`);
    const data = await res.json();
    assert(data.guardado === true, 'La encuesta no reportó guardado exitoso');
    assert(data.totalRespuestas === 12, 'No se guardaron las 12 respuestas');
  });

  // 6. Integración Métricas de Tesis: Cálculo agregado por dimensión de calidad
  await test('INT-06: Consulta de métricas agregadas de la Variable X (Tesis)', async () => {
    const res = await fetch(`${BASE_URL}/encuesta/resumen`, {
      headers: { Authorization: `Bearer ${tokenTamizaje}` },
    });
    assert(res.status === 200, `Status esperado 200, recibido ${res.status}`);
    const data = await res.json();
    assert(data.global.promedioGeneral > 0, 'El promedio general debe ser mayor a 0');
    assert(data.porDimension.length === 4, 'Deben existir 4 dimensiones en el resumen');
    assert(data.distribucion.length === 5, 'La distribución Likert debe tener 5 niveles');
  });

  // 7. Integración Reportes y Auditoría: Emisión de reporte formal y registro en bitácora
  await test('INT-07: Emisión de reporte clínico y auditoría DESCARGAR_REPORTE en bitácora', async () => {
    const resRep = await fetch(`${BASE_URL}/reportes/evaluacion/${idEvaluacionCreada}`, {
      headers: { Authorization: `Bearer ${tokenTamizaje}` },
    });
    assert(resRep.status === 200, `Status esperado 200, recibido ${resRep.status}`);
    const dataRep = await resRep.json();
    assert(dataRep.codigoAnonimo === codigoAnonimo, 'El código anónimo en el reporte no coincide');
    assert(dataRep.factores.length > 0, 'El reporte no contiene factores explicativos');

    // Verificar en bitácora con token de Admin
    const resBit = await fetch(`${BASE_URL}/admin/bitacora?limite=5`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert(resBit.status === 200, `Status esperado 200, recibido ${resBit.status}`);
    const dataBit = await resBit.json();
    const accionReporte = dataBit.find((b) => b.accion === 'DESCARGAR_REPORTE');
    assert(accionReporte, 'No se encontró el evento DESCARGAR_REPORTE en la bitácora de auditoría');
  });

  // 8. Integración Cierre de Sesión: Registro de LOGOUT en bitácora
  await test('INT-08: Cierre de sesión y verificación de auditoría LOGOUT', async () => {
    const resOut = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenTamizaje}` },
    });
    assert(resOut.status === 200, `Status esperado 200, recibido ${resOut.status}`);

    const resBit = await fetch(`${BASE_URL}/admin/bitacora?limite=3`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const dataBit = await resBit.json();
    const accionLogout = dataBit.find((b) => b.accion === 'LOGOUT');
    assert(accionLogout, 'No se registró la acción LOGOUT en la bitácora');
  });

  const tiempoTotal = ((Date.now() - inicioTotal) / 1000).toFixed(2);
  console.log(`\n${colores.bold}----------------------------------------------------------------------${colores.reset}`);
  console.log(`Resultados de Integración: ${colores.verde}${pasadas} aprobadas${colores.reset}, ${fallidas > 0 ? colores.rojo : ''}${fallidas} fallidas${colores.reset} en ${tiempoTotal}s.`);
  console.log(`${colores.bold}----------------------------------------------------------------------${colores.reset}\n`);

  if (fallidas > 0) process.exit(1);
}

ejecutarPruebasIntegracion().catch((e) => {
  console.error('Error general en pruebas de integración:', e);
  process.exit(1);
});
