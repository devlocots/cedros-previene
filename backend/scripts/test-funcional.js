/**
 * CEDROS PREVIENE - SUITE DE PRUEBAS FUNCIONALES Y DE CASOS DE BORDE (TIPO 3: FUNCTIONAL TESTING)
 * Rúbrica T2: Monitoreo Avance de Proyectos 02 - Semana 10
 *
 * Valida las reglas de negocio, historias de usuario (HU01, HU02, HU03, HU04, HU10, HU11, HU12)
 * y el manejo estricto de casos límite / bordes fisiológicos.
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

async function ejecutarPruebasFuncionales() {
  console.log(`\n${colores.bold}${colores.amarillo}======================================================================${colores.reset}`);
  console.log(`${colores.bold}${colores.amarillo}   CEDROS PREVIENE · PRUEBAS FUNCIONALES Y DE ACEPTACIÓN (SEMANA 10)  ${colores.reset}`);
  console.log(`${colores.bold}${colores.amarillo}======================================================================${colores.reset}\n`);

  let pasadas = 0;
  let fallidas = 0;
  const inicioTotal = Date.now();

  async function test(id, descripcion, fn) {
    const encabezado = `  [${id}] ${descripcion}`;
    process.stdout.write(`${encabezado.padEnd(68, '.')} `);
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

  // Autenticar para pruebas autenticadas
  const authRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo: 'tamizaje1@cedrosprevine.pe', password: 'Cedros2026!' }),
  });
  const authData = await authRes.json();
  tokenTamizaje = authData.token;

  const adminRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo: 'admin@cedrosprevine.pe', password: 'Cedros2026!' }),
  });
  const adminData = await adminRes.json();
  tokenAdmin = adminData.token;

  // TC-FUNC-01: Login correcto
  await test('TC-FUNC-01', 'HU10: Autenticación exitosa con credenciales válidas (200 OK)', async () => {
    assert(tokenTamizaje && tokenTamizaje.length > 20, 'Token JWT no emitido correctamente');
  });

  // TC-FUNC-02: Login rechazado con clave incorrecta
  await test('TC-FUNC-02', 'HU10: Rechazo de autenticación con contraseña incorrecta (401)', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: 'tamizaje1@cedrosprevine.pe', password: 'ClaveInvalida!' }),
    });
    assert(res.status === 401, `Se esperaba HTTP 401, recibido ${res.status}`);
  });

  // TC-FUNC-03: Rechazo de edad < 18
  await test('TC-FUNC-03', 'HU02: Rechazo de participante menor de edad < 18 años (400)', async () => {
    const res = await fetch(`${BASE_URL}/evaluaciones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenTamizaje}`,
      },
      body: JSON.stringify({
        sexo: 'M',
        edad: 15, // INVÁLIDO
        embarazos: 0,
        glucosa: 100,
        presion: 70,
        imc: 22,
        pedigree: 0.3,
      }),
    });
    assert(res.status === 400, `Se esperaba HTTP 400 por edad < 18, recibido ${res.status}`);
  });

  // TC-FUNC-04: Rechazo de glucosa > 400 mg/dL
  await test('TC-FUNC-04', 'HU02: Rechazo de valor de glucosa fuera de rango > 400 mg/dL (400)', async () => {
    const res = await fetch(`${BASE_URL}/evaluaciones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenTamizaje}`,
      },
      body: JSON.stringify({
        sexo: 'M',
        edad: 35,
        embarazos: 0,
        glucosa: 450, // INVÁLIDO: Rango válido 40 a 400
        presion: 80,
        imc: 25,
        pedigree: 0.4,
      }),
    });
    assert(res.status === 400, `Se esperaba HTTP 400 por glucosa extrema, recibido ${res.status}`);
  });

  // TC-FUNC-05: Rechazo de presión diastólica < 30 mmHg
  await test('TC-FUNC-05', 'HU02: Rechazo de presión diastólica < 30 mmHg (400)', async () => {
    const res = await fetch(`${BASE_URL}/evaluaciones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenTamizaje}`,
      },
      body: JSON.stringify({
        sexo: 'F',
        edad: 40,
        embarazos: 1,
        glucosa: 95,
        presion: 20, // INVÁLIDO: Rango válido 30 a 140
        imc: 24,
        pedigree: 0.2,
      }),
    });
    assert(res.status === 400, `Se esperaba HTTP 400 por presión inválida, recibido ${res.status}`);
  });

  // TC-FUNC-06: Test público con consentimiento y cálculo automático de IMC
  await test('TC-FUNC-06', 'HU12: Test público anónimo con cálculo dinámico de IMC (201)', async () => {
    const res = await fetch(`${BASE_URL}/evaluaciones/publica`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sexo: 'M',
        edad: 42,
        pesoKg: 85,
        tallaCm: 172,
        antecedenteFamiliar: 'Uno',
        presion: 82,
        glucosa: 110,
        consentimiento: true,
      }),
    });
    assert(res.status === 201, `Se esperaba HTTP 201, recibido ${res.status}`);
    const data = await res.json();
    assert(data.imc > 28 && data.imc < 29, `IMC esperado ~28.7, recibido ${data.imc}`);
    assert(data.codigo && data.codigo.startsWith('P-'), 'Código anónimo no emitido');
  });

  // TC-FUNC-07: Imputación de campos opcionales omitidos
  await test('TC-FUNC-07', 'HU03: Imputación por mediana de laboratorio (insulina/pliegue)', async () => {
    const res = await fetch(`${BASE_URL}/evaluaciones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenTamizaje}`,
      },
      body: JSON.stringify({
        sexo: 'M',
        edad: 52,
        embarazos: 0,
        glucosa: 120,
        presion: 80,
        pliegue: null, // Omitido
        insulina: null, // Omitido
        imc: 31.0,
        pedigree: 0.6,
      }),
    });
    const data = await res.json();
    assert(data.imputados.includes('pliegue') || data.imputados.includes('pliegue_cutaneo'), 'Pliegue no imputado');
    assert(data.imputados.includes('insulina'), 'Insulina no imputada');
  });

  // TC-FUNC-08: Umbrales y niveles de riesgo
  await test('TC-FUNC-08', 'HU04: Categorización estricta del nivel de riesgo (Bajo/Mod/Alto)', async () => {
    const res = await fetch(`${BASE_URL}/evaluaciones/publica`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sexo: 'F',
        edad: 22,
        pesoKg: 52,
        tallaCm: 165,
        antecedenteFamiliar: 'Ninguno',
        presion: 70,
        glucosa: 80,
        consentimiento: true,
      }),
    });
    const data = await res.json();
    assert(data.nivel === 'Bajo', `Perfil joven y saludable debería resultar Bajo, obtenido: ${data.nivel}`);
  });

  // TC-FUNC-09: Control de acceso por rol (RBAC)
  await test('TC-FUNC-09', 'RBAC: Rechazo de acceso a módulo Admin para rol Tamizaje (403)', async () => {
    const res = await fetch(`${BASE_URL}/admin/usuarios`, {
      headers: { Authorization: `Bearer ${tokenTamizaje}` },
    });
    assert(res.status === 403, `Se esperaba HTTP 403 Forbidden para usuario no admin, recibido ${res.status}`);
  });

  // TC-FUNC-10: Validación de puntaje Likert en encuesta ISO 25010
  await test('TC-FUNC-10', 'ISO 25010: Rechazo de puntaje Likert fuera del rango 1 a 5 (400)', async () => {
    const res = await fetch(`${BASE_URL}/encuesta`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenTamizaje}`,
      },
      body: JSON.stringify({
        idEvaluacion: 2,
        respuestas: [
          { dimension: 'Seguridad', indicador: 'Confidencialidad', puntaje: 9 }, // INVÁLIDO: 9 no existe en Likert 1..5
        ],
      }),
    });
    assert(res.status === 400, `Se esperaba HTTP 400 por puntaje fuera de escala, recibido ${res.status}`);
  });

  // TC-FUNC-11: Creación de usuario por Admin
  const emailAleatorio = `medico_test_${Date.now()}@cedrosprevine.pe`;
  let idUsuarioCreado = null;
  await test('TC-FUNC-11', 'Admin: Creación de cuenta de personal y asignación de rol (201)', async () => {
    const res = await fetch(`${BASE_URL}/admin/usuarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({
        nombres: 'Dra. Prueba Automatizada',
        correo: emailAleatorio,
        password: 'PasswordSegura2026!',
        idRol: 2, // Médico
      }),
    });
    assert(res.status === 201, `Se esperaba HTTP 201, recibido ${res.status}`);
    const data = await res.json();
    assert(data.creado === true, 'No se confirmó la creación');
    idUsuarioCreado = data.idUsuario;
  });

  // TC-FUNC-12: Rechazo de correo duplicado
  await test('TC-FUNC-12', 'Admin: Rechazo de correo duplicado en alta de usuario (409)', async () => {
    const res = await fetch(`${BASE_URL}/admin/usuarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({
        nombres: 'Intento Duplicado',
        correo: emailAleatorio, // Ya existe del test anterior
        password: 'PasswordSegura2026!',
        idRol: 2,
      }),
    });
    assert(res.status === 409, `Se esperaba HTTP 409 Conflict, recibido ${res.status}`);
  });

  const tiempoTotal = ((Date.now() - inicioTotal) / 1000).toFixed(2);
  console.log(`\n${colores.bold}----------------------------------------------------------------------${colores.reset}`);
  console.log(`Resultados Funcionales: ${colores.verde}${pasadas} aprobadas${colores.reset}, ${fallidas > 0 ? colores.rojo : ''}${fallidas} fallidas${colores.reset} en ${tiempoTotal}s.`);
  console.log(`${colores.bold}----------------------------------------------------------------------${colores.reset}\n`);

  if (fallidas > 0) process.exit(1);
}

ejecutarPruebasFuncionales().catch((e) => {
  console.error('Error general en pruebas funcionales:', e);
  process.exit(1);
});
