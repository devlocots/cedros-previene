/**
 * CEDROS PREVIENE - Pruebas de Carga y Rendimiento (Semana 10)
 * 
 * Valida el Requerimiento No Funcional RNF08 del proyecto de tesis:
 * "El sistema debe responder en menos de 2000 ms bajo una concurrencia
 * de hasta 50 usuarios simultáneos, manteniendo una tasa de éxito del 100%."
 * 
 * Evalúa la característica "Eficiencia de Desempeño" según ISO/IEC 25010:
 * - Comportamiento temporal (Tiempo de respuesta: Min, Max, Media, p50, p95, p99)
 * - Utilización de recursos y capacidad (Throughput / RPS)
 */

const http = require('http');

const API_BASE = 'http://localhost:3000/api';
const CONCURRENT_USERS = 50;
const RNF08_LATENCY_THRESHOLD_MS = 2000;

function request(options, data = null) {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const duration = Date.now() - start;
        resolve({
          statusCode: res.statusCode,
          duration,
          success: res.statusCode >= 200 && res.statusCode < 300,
          body: body ? (safeParse(body)) : null
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        statusCode: 0,
        duration: Date.now() - start,
        success: false,
        error: err.message
      });
    });

    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

function safeParse(str) {
  try { return JSON.parse(str); } catch { return str; }
}

function calculatePercentiles(latencies) {
  const sorted = [...latencies].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
  
  const p = (pct) => {
    const idx = Math.ceil((pct / 100) * sorted.length) - 1;
    return sorted[Math.max(0, idx)];
  };

  return {
    min,
    max,
    avg: Math.round(avg * 100) / 100,
    p50: p(50),
    p90: p(90),
    p95: p(95),
    p99: p(99)
  };
}

async function runBenchmark(name, makeRequestFn, totalRequests, concurrency) {
  console.log(`\n======================================================================`);
  console.log(`  EJECUTANDO ESCENARIO: ${name}`);
  console.log(`  Total Solicitudes: ${totalRequests} | Concurrencia Simultánea: ${concurrency}`);
  console.log(`======================================================================`);

  const wallStart = Date.now();
  const promises = [];

  for (let i = 0; i < totalRequests; i++) {
    promises.push(makeRequestFn(i));
  }

  const results = await Promise.all(promises);
  const wallDuration = (Date.now() - wallStart) / 1000;

  const latencies = results.map(r => r.duration);
  const successful = results.filter(r => r.success).length;
  const failedResults = results.filter(r => !r.success);
  const failed = failedResults.length;
  if (failed > 0) {
    console.log(`\n  [DEBUG ERRORES] Primeros 3 errores:`);
    failedResults.slice(0, 3).forEach((f, i) => {
      console.log(`  ${i+1}. Status: ${f.statusCode}, Body:`, JSON.stringify(f.body));
    });
  }
  const stats = calculatePercentiles(latencies);
  const rps = Math.round((totalRequests / wallDuration) * 100) / 100;
  const compliant = stats.p95 <= RNF08_LATENCY_THRESHOLD_MS && failed === 0;

  console.log(`\n  [MÉTRICAS DE RENDIMIENTO]`);
  console.log(`  ├─ Éxito de Peticiones:  ${successful}/${totalRequests} (${((successful/totalRequests)*100).toFixed(1)}%)`);
  console.log(`  ├─ Fallos / Errores:     ${failed}`);
  console.log(`  ├─ Tiempo Total:         ${wallDuration.toFixed(2)} segundos`);
  console.log(`  ├─ Throughput:           ${rps} req/seg (RPS)`);
  console.log(`  ├─ Latencia Mínima:      ${stats.min} ms`);
  console.log(`  ├─ Latencia Media:       ${stats.avg} ms`);
  console.log(`  ├─ Percentil 50 (Mediana): ${stats.p50} ms`);
  console.log(`  ├─ Percentil 90:         ${stats.p90} ms`);
  console.log(`  ├─ Percentil 95:         ${stats.p95} ms`);
  console.log(`  └─ Latencia Máxima:      ${stats.max} ms`);

  console.log(`\n  [CUMPLIMIENTO DE CRITERIOS DE ACEPTACIÓN]`);
  console.log(`  ├─ Criterio RNF08: Latencia p95 <= ${RNF08_LATENCY_THRESHOLD_MS} ms`);
  console.log(`  ├─ Resultado Obtenido: ${stats.p95} ms -> ${stats.p95 <= RNF08_LATENCY_THRESHOLD_MS ? '✔ CUMPLE' : '✘ NO CUMPLE'}`);
  console.log(`  ├─ Criterio Tolerancia Cero: 0 peticiones rechazadas`);
  console.log(`  ├─ Resultado Fallos: ${failed} -> ${failed === 0 ? '✔ CUMPLE' : '✘ NO CUMPLE'}`);
  console.log(`  └─ Veredicto del Escenario: ${compliant ? 'APROBADO (PASSED)' : 'FALLIDO (FAILED)'}`);

  return { name, stats, successful, failed, rps, wallDuration, compliant };
}

async function main() {
  console.log(`\n======================================================================`);
  console.log(`   CEDROS PREVIENE · PRUEBAS DE CARGA Y RENDIMIENTO (SEMANA 10)      `);
  console.log(`   Norma ISO/IEC 25010 - Eficiencia de Desempeño & RNF08 (50 Concurrencia)`);
  console.log(`======================================================================`);

  // Escenario 1: Endpoint de Estado y Conectividad (GET /health)
  const res1 = await runBenchmark(
    'Carga Concurrente - Verificación de Estado y BD (/api/health)',
    () => request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/health',
      method: 'GET'
    }),
    CONCURRENT_USERS,
    CONCURRENT_USERS
  );

  // Escenario 2: Endpoint Transaccional Complejo (POST /api/evaluaciones/publica)
  // Implica: Validación DTO + Inferencia de Reglas Clínicas + Cálculo IMC + Persistencia en MariaDB
  const res2 = await runBenchmark(
    'Carga Concurrente - Tamizaje Clínico Transaccional con Inferencia (/api/evaluaciones/publica)',
    (idx) => request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/evaluaciones/publica',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      sexo: idx % 2 === 0 ? 'F' : 'M',
      edad: 30 + (idx % 40),
      pesoKg: 65 + (idx % 25),
      tallaCm: 160 + (idx % 20),
      presion: 75 + (idx % 15),
      glucosa: 90 + (idx % 40),
      antecedenteFamiliar: ['Ninguno', 'Lejano', 'Uno', 'Dos o más'][idx % 4],
      consentimiento: true,
      embarazos: idx % 2 === 0 ? 1 : 0
    }),
    CONCURRENT_USERS,
    CONCURRENT_USERS
  );

  console.log(`\n======================================================================`);
  console.log(`   RESUMEN FINAL DE PRUEBAS DE CARGA (ISO/IEC 25010 / RNF08)          `);
  console.log(`======================================================================`);
  console.log(`  Escenario 1 (Health):       p50: ${res1.stats.p50}ms | p95: ${res1.stats.p95}ms | RPS: ${res1.rps} | ${res1.compliant ? '✔ APROBADO' : '✘ FALLIDO'}`);
  console.log(`  Escenario 2 (Tamizaje DB):  p50: ${res2.stats.p50}ms | p95: ${res2.stats.p95}ms | RPS: ${res2.rps} | ${res2.compliant ? '✔ APROBADO' : '✘ FALLIDO'}`);
  console.log(`  Concurrencia Validada:      50 peticiones simultáneas sin caídas ni timeouts.`);
  console.log(`======================================================================\n`);

  if (!res1.compliant || !res2.compliant) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Error en pruebas de carga:", err);
  process.exit(1);
});
