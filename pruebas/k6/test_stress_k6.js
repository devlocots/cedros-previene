import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * CEDROS PREVIENE - Script de Pruebas de Stress con K6 (Semana 10)
 * 
 * Valida el comportamiento del sistema ante incrementos de carga concurrente:
 * - Etapa 1: Calentamiento a 20 usuarios (10s)
 * - Etapa 2: Carga nominal a 50 usuarios concurrentes según RNF08 (30s)
 * - Etapa 3: Pico de estrés a 100 usuarios concurrentes (20s)
 * - Etapa 4: Desaceleración y recuperación a 0 usuarios (10s)
 * 
 * Umbrales de Aceptación (SLA):
 * - El 95% de las solicitudes deben responder en menos de 2000 ms (RNF08).
 * - La tasa de error debe ser inferior al 1.0%.
 */

export const options = {
  stages: [
    { duration: '10s', target: 20 },
    { duration: '30s', target: 50 },
    { duration: '20s', target: 100 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // Criterio RNF08: p95 <= 2000 ms
    http_req_failed: ['rate<0.01'],    // Tolerancia a fallos: < 1%
  },
};

const BASE_URL = 'http://localhost:3000/api';

export default function () {
  // 1. Verificación de salud y conectividad de base de datos
  const resHealth = http.get(`${BASE_URL}/health`);
  check(resHealth, {
    'Health Check devuelve 200 OK': (r) => r.status === 200,
    'BD conectada': (r) => r.json('baseDatos') === 'ok',
  });

  // 2. Tamizaje clínico concurrente con inferencia y persistencia
  const payload = JSON.stringify({
    sexo: __VU % 2 === 0 ? 'F' : 'M',
    edad: 35 + (__ITER % 35),
    pesoKg: 70 + (__ITER % 25),
    tallaCm: 165 + (__ITER % 15),
    antecedenteFamiliar: ['Ninguno', 'Lejano', 'Uno', 'Dos o más'][__ITER % 4],
    presion: 78 + (__ITER % 14),
    glucosa: 95 + (__ITER % 35),
    consentimiento: true,
    embarazos: __VU % 2 === 0 ? 1 : 0,
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  const resEval = http.post(`${BASE_URL}/evaluaciones/publica`, payload, params);
  check(resEval, {
    'Evaluación devuelve 201 Created': (r) => r.status === 201,
    'Código anónimo emitido': (r) => r.json('codigo') !== undefined,
    'Score de riesgo calculado': (r) => r.json('scoreRiesgo') >= 0,
  });

  sleep(0.5);
}
