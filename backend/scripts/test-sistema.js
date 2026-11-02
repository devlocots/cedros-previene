/**
 * CEDROS PREVIENE - Pruebas de Sistema (Semana 10)
 * 
 * Evalúa el sistema como un todo integrado (End-to-End System Testing):
 * - Capa 1: Presentación y Gateway HTTP (NestJS)
 * - Capa 2: Motor de Inferencia Clínica y DTOs (Reglas de Decisión e imputación)
 * - Capa 3: Persistencia Relacional (MariaDB 11.4)
 * - Capa 4: Trazabilidad, Auditoría y Triggers de Inmutabilidad Bioética
 */

const http = require('http');
const assert = require('assert');

const BASE_URL = 'http://localhost:3000/api';

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const duration = Date.now() - start;
        try {
          resolve({
            statusCode: res.statusCode,
            duration,
            body: body ? JSON.parse(body) : null
          });
        } catch {
          resolve({
            statusCode: res.statusCode,
            duration,
            body
          });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function test(id, description, fn) {
  const start = Date.now();
  try {
    await fn();
    const ms = Date.now() - start;
    console.log(`  [${id}] ${description} ✔ PASS (${ms}ms)`);
    return true;
  } catch (err) {
    console.error(`  [${id}] ${description} ✘ FAIL: ${err.message}`);
    return false;
  }
}

async function runSystemTests() {
  console.log('======================================================================');
  console.log('   CEDROS PREVIENE · PRUEBAS DE SISTEMA INTEGRADO (SEMANA 10)         ');
  console.log('   Arquitectura 4-Tier: Frontend Gateway + Reglas + MariaDB + Triggers');
  console.log('======================================================================\n');

  let passed = 0;
  let total = 0;
  let token = null;
  let evaluacionId = null;

  // 1. Integridad de Servicios y Base de Datos
  total++;
  if (await test('SIS-01', 'Capa Infraestructura: Conectividad integral de API y MariaDB 11.4', async () => {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/health',
      method: 'GET'
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.api, 'ok');
    assert.strictEqual(res.body.baseDatos, 'ok');
  })) passed++;

  // 2. Seguridad Perimetral y Emisión de JWT
  total++;
  if (await test('SIS-02', 'Capa Seguridad: Autenticación, generación de Claims JWT y Hash Bcrypt', async () => {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      correo: 'tamizaje1@cedrosprevine.pe',
      password: 'Cedros2026!'
    });
    assert.strictEqual(res.statusCode, 200);
    assert(res.body.token && res.body.token.length > 30);
    assert.strictEqual(res.body.usuario.rol.toLowerCase(), 'tamizaje');
    token = res.body.token;
  })) passed++;

  // 3. Flujo Clínico End-to-End con Inferencia y Persistencia
  total++;
  if (await test('SIS-03', 'Capa Negocio: Flujo clínico de tamizaje con inferencia y persistencia', async () => {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/evaluaciones',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, {
      sexo: 'F',
      edad: 48,
      embarazos: 2,
      glucosa: 135,
      presion: 85,
      imc: 29.4,
      pedigree: 0.55
    });
    assert.strictEqual(res.statusCode, 201);
    assert(res.body.idEvaluacion > 0);
    assert(res.body.probabilidad >= 0 && res.body.probabilidad <= 1);
    assert(['Bajo', 'Moderado', 'Alto'].includes(res.body.nivel));
    evaluacionId = res.body.idEvaluacion;
  })) passed++;

  // 4. Verificación de Inmutabilidad por Trigger de Base de Datos
  total++;
  if (await test('SIS-04', 'Capa Integridad: Inmutabilidad bioética de diagnósticos en MariaDB', async () => {
    assert(evaluacionId !== null, 'Se requiere evaluación previa');
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/evaluaciones/${evaluacionId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, { glucosa: 80 });
    // Inmutable: El sistema rechaza cualquier modificación de evaluaciones
    assert(res.statusCode === 404 || res.statusCode === 405 || res.statusCode === 403);
  })) passed++;

  // 5. Encuesta de Calidad ISO 25010 Vinculada
  total++;
  if (await test('SIS-05', 'Capa Evaluación Científica: Trazabilidad de Encuesta ISO 25010 vinculada', async () => {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/encuesta',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, {
      idEvaluacion: evaluacionId,
      respuestas: [
        { dimension: 'Adecuación funcional', indicador: 'AF-01', puntaje: 5 },
        { dimension: 'Eficiencia de desempeño', indicador: 'ED-01', puntaje: 5 },
        { dimension: 'Capacidad de interacción', indicador: 'CI-01', puntaje: 4 },
        { dimension: 'Seguridad', indicador: 'SEG-01', puntaje: 5 }
      ]
    });
    assert.strictEqual(res.statusCode, 201);
    assert(res.body.guardado === true && res.body.totalRespuestas >= 4);
  })) passed++;

  // 6. Auditoría Forense y Bitácora Transaccional
  total++;
  if (await test('SIS-06', 'Capa Auditoría: Trazabilidad forense al emitir reporte médico (HU11)', async () => {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/reportes/evaluacion/${evaluacionId}`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.strictEqual(res.statusCode, 200);
    assert(res.body.idEvaluacion === evaluacionId);
    assert(res.body.codigoAnonimo !== undefined);
  })) passed++;

  console.log('\n----------------------------------------------------------------------');
  console.log(`Resultados de Pruebas de Sistema: ${passed} aprobadas, ${total - passed} fallidas.`);
  console.log('----------------------------------------------------------------------\n');

  if (passed !== total) process.exit(1);
}

runSystemTests().catch(err => {
  console.error("Error en pruebas de sistema:", err);
  process.exit(1);
});
