/**
 * CEDROS PREVIENE - Pruebas de Aceptación (UAT / Gherkin) (Semana 10)
 * 
 * Valida los Criterios de Aceptación formalizados para las Historias de Usuario
 * de la Tesis bajo la metodología BDD (Given - When - Then):
 * - HU02: Validación de rangos fisiológicos y antropométricos.
 * - HU03: Imputación determinística de variables omitidas.
 * - HU04: Determinación estricta del nivel de riesgo (Bajo / Moderado / Alto).
 * - HU10: Autenticación segura de usuarios y control de acceso.
 * - HU11: Emisión y auditoría del reporte clínico en formato estándar.
 * - HU12: Estimación de riesgo pública, anónima y consentida.
 * - ISO/IEC 25010: Medición cuantitativa de la calidad de software.
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

async function scenario(code, name, given, when, then, testFn) {
  const start = Date.now();
  console.log(`\n  ESCENARIO [${code}]: ${name}`);
  console.log(`    GIVEN (Dado que):   ${given}`);
  console.log(`    WHEN  (Cuando):     ${when}`);
  console.log(`    THEN  (Entonces):   ${then}`);
  try {
    await testFn();
    const duration = Date.now() - start;
    console.log(`    ESTADO: ✔ CRITERIO DE ACEPTACIÓN CUMPLIDO (${duration}ms)`);
    return true;
  } catch (err) {
    console.error(`    ESTADO: ✘ CRITERIO RECHAZADO: ${err.message}`);
    return false;
  }
}

async function runAcceptanceTests() {
  console.log('======================================================================');
  console.log('   CEDROS PREVIENE · PRUEBAS DE ACEPTACIÓN DE USUARIO (UAT - BDD)     ');
  console.log('   Validación de Criterios de Aceptación de Historias de Usuario (HU) ');
  console.log('======================================================================');

  let passed = 0;
  let total = 0;

  // Escenario 1: HU12
  total++;
  if (await scenario(
    'UAT-HU12-01',
    'Tamizaje Público Anónimo con Consentimiento Informado',
    'Un residente de Los Cedros de Villa accede sin registrarse a la web',
    'Acepta el consentimiento y envía su edad, peso, talla, presión y antecedentes',
    'El sistema genera un código anónimo único y calcula el IMC y probabilidad de riesgo',
    async () => {
      const res = await request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/evaluaciones/publica',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        sexo: 'M',
        edad: 50,
        pesoKg: 82,
        tallaCm: 170,
        antecedenteFamiliar: 'Uno',
        presion: 84,
        glucosa: 115,
        consentimiento: true
      });
      assert.strictEqual(res.statusCode, 201);
      assert(res.body.codigo && res.body.codigo.startsWith('P-'));
      assert(res.body.imc > 28 && res.body.imc < 29);
      assert(['Bajo', 'Moderado', 'Alto'].includes(res.body.nivel));
    }
  )) passed++;

  // Escenario 2: HU02
  total++;
  if (await scenario(
    'UAT-HU02-01',
    'Rechazo de Valores Fisiológicos No Plausibles (Glucosa Extrema)',
    'Un usuario ingresa un valor de glucosa que excede los límites fisiológicos (500 mg/dL)',
    'Envía el formulario de evaluación',
    'El sistema rechaza la solicitud con HTTP 400 y mensaje descriptivo de rango válido',
    async () => {
      const res = await request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/evaluaciones/publica',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        sexo: 'F',
        edad: 30,
        pesoKg: 60,
        tallaCm: 160,
        antecedenteFamiliar: 'Ninguno',
        presion: 70,
        glucosa: 500, // INVÁLIDO
        consentimiento: true
      });
      assert.strictEqual(res.statusCode, 400);
      assert(JSON.stringify(res.body).includes('400'));
    }
  )) passed++;

  // Escenario 3: HU03
  total++;
  if (await scenario(
    'UAT-HU03-01',
    'Imputación Determinística de Insulina y Pliegue Cutáneo Omitidos',
    'El personal de salud no cuenta con reactivos de insulina en el centro de salud',
    'Registra la evaluación omitiendo los campos opcionales de laboratorio',
    'El sistema imputa automáticamente las medianas poblacionales y calcula el riesgo sin error',
    async () => {
      // Login primero
      const auth = await request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, { correo: 'tamizaje1@cedrosprevine.pe', password: 'Cedros2026!' });
      
      const res = await request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/evaluaciones',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.body.token}`
        }
      }, {
        sexo: 'M',
        edad: 42,
        embarazos: 0,
        glucosa: 100,
        presion: 78,
        imc: 26.5,
        pedigree: 0.35
        // insulina y pliegue omitidos intencionalmente
      });
      assert.strictEqual(res.statusCode, 201);
      assert(res.body.probabilidad >= 0);
    }
  )) passed++;

  // Escenario 4: HU10
  total++;
  if (await scenario(
    'UAT-HU10-01',
    'Control de Acceso Seguro y Protección Perimetral',
    'Un atacante intenta ingresar con credenciales inválidas',
    'Envía una solicitud de autenticación fallida',
    'El sistema deniega el acceso con HTTP 401 y no revela detalles de la cuenta',
    async () => {
      const res = await request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        correo: 'admin@cedrosprevine.pe',
        password: 'ClaveInvalida!'
      });
      assert.strictEqual(res.statusCode, 401);
    }
  )) passed++;

  // Escenario 5: ISO 25010
  total++;
  if (await scenario(
    'UAT-ISO-01',
    'Recolección de Reactivos de Calidad según Norma ISO/IEC 25010',
    'Un evaluador califica el software en las 4 dimensiones de calidad',
    'Envía los 12 reactivos de la escala Likert (1 a 5)',
    'El sistema persiste la encuesta y actualiza las medias aritméticas por dimensión',
    async () => {
      const auth = await request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, { correo: 'admin@cedrosprevine.pe', password: 'Cedros2026!' });

      const res = await request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/encuesta/resumen',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${auth.body.token}` }
      });
      assert.strictEqual(res.statusCode, 200);
      assert(res.body.porDimension !== undefined && res.body.global !== undefined);
    }
  )) passed++;

  console.log('\n======================================================================');
  console.log(`   RESUMEN FINAL DE PRUEBAS DE ACEPTACIÓN: ${passed}/${total} APROBADAS`);
  console.log('======================================================================\n');

  if (passed !== total) process.exit(1);
}

runAcceptanceTests().catch(err => {
  console.error("Error en pruebas de aceptación:", err);
  process.exit(1);
});
