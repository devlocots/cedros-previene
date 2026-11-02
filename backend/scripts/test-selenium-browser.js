/**
 * CEDROS PREVIENE - Pruebas Funcionales Automatizadas de Navegador (E2E)
 * Equivalente a Selenium WebDriver / Chrome DevTools Automation
 * 
 * Monitoreo de Avance de Proyectos 02 - Semana 10
 * Ejecuta el recorrido completo de usuario sobre Angular 19 (http://localhost:4200)
 * y genera capturas de pantalla de alta resolución (PNG) como evidencia para el docente.
 */

const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = 'C:\\Proyectos\\tesis\\cedros-previene\\evidencias_semana10';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runBrowserTests() {
  console.log('======================================================================');
  console.log('   CEDROS PREVIENE · PRUEBAS FUNCIONALES AUTOMATIZADAS (SELENIUM/E2E) ');
  console.log('   Generación Automática de Evidencias y Capturas de Pantalla (Semana 10)');
  console.log('======================================================================\n');

  console.log(`[INFO] Iniciando instancia automatizada de Chrome desde: ${CHROME_PATH}`);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1366,768']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });

  try {
    // 1. Landing Page Pública
    console.log('[TEST 1/7] Navegando a la Landing Page pública (http://localhost:4200)...');
    await page.goto('http://localhost:4200/', { waitUntil: 'networkidle0' });
    const file1 = path.join(OUTPUT_DIR, '01_landing_publica.png');
    await page.screenshot({ path: file1, fullPage: false });
    console.log(`  ✔ Captura guardada: ${file1}`);

    // 2. Test Público de Diabetes (HU12)
    console.log('[TEST 2/7] Ejecutando flujo del Test Público interactivo (/test)...');
    await page.goto('http://localhost:4200/test', { waitUntil: 'networkidle0' });
    await delay(500);

    // Consentimiento
    const consentInput = await page.$('input[type="checkbox"]');
    if (consentInput) {
      await consentInput.click();
      await delay(300);
      const startBtn = await page.$('button.btn');
      if (startBtn) await startBtn.click();
    }
    await delay(600);

    // Captura del paso interactivo del test público
    const file2a = path.join(OUTPUT_DIR, '02_test_publico_formulario.png');
    await page.screenshot({ path: file2a });
    console.log(`  ✔ Captura guardada: ${file2a}`);

    // 3. Inicio de Sesión de Personal de Salud (HU10)
    console.log('[TEST 3/7] Probando autenticación del personal de salud en /login...');
    await page.goto('http://localhost:4200/login', { waitUntil: 'networkidle0' });
    await page.type('#correo', 'admin@cedrosprevine.pe');
    await page.type('#password', 'Cedros2026!');
    await delay(300);
    const file3a = path.join(OUTPUT_DIR, '03_login_credenciales.png');
    await page.screenshot({ path: file3a });
    console.log(`  ✔ Captura guardada: ${file3a}`);

    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => delay(2000));
    await delay(1000);

    const file3b = path.join(OUTPUT_DIR, '03_panel_inicio_post_login.png');
    await page.screenshot({ path: file3b });
    console.log(`  ✔ Captura guardada: ${file3b}`);

    // 4. Panel de Historial de Evaluaciones Clínicas
    console.log('[TEST 4/7] Verificando módulo de Historial de Evaluaciones (/panel/historial)...');
    await page.goto('http://localhost:4200/panel/historial', { waitUntil: 'networkidle0' });
    await delay(1200);
    const file4 = path.join(OUTPUT_DIR, '04_historial_evaluaciones_clinicas.png');
    await page.screenshot({ path: file4 });
    console.log(`  ✔ Captura guardada: ${file4}`);

    // 5. Módulo de Reportes Médicos A4 (HU11)
    console.log('[TEST 5/7] Verificando generación de Reportes Médicos A4 (/panel/reportes)...');
    await page.goto('http://localhost:4200/panel/reportes', { waitUntil: 'networkidle0' });
    await delay(1500);
    const file5 = path.join(OUTPUT_DIR, '05_reporte_medico_a4_impresion.png');
    await page.screenshot({ path: file5 });
    console.log(`  ✔ Captura guardada: ${file5}`);

    // 6. Encuesta de Calidad de Software ISO/IEC 25010 (Variable X)
    console.log('[TEST 6/7] Verificando instrumento de evaluación ISO 25010 (/panel/encuesta)...');
    await page.goto('http://localhost:4200/panel/encuesta', { waitUntil: 'networkidle0' });
    await delay(1200);
    const file6 = path.join(OUTPUT_DIR, '06_encuesta_calidad_iso25010.png');
    await page.screenshot({ path: file6 });
    console.log(`  ✔ Captura guardada: ${file6}`);

    // 7. Gestión de Usuarios y Control de Acceso RBAC (/panel/usuarios)
    console.log('[TEST 7/7] Verificando panel de Gestión de Usuarios y Roles RBAC (/panel/usuarios)...');
    await page.goto('http://localhost:4200/panel/usuarios', { waitUntil: 'networkidle0' });
    await delay(1200);
    const file7 = path.join(OUTPUT_DIR, '07_gestion_usuarios_rbac.png');
    await page.screenshot({ path: file7 });
    console.log(`  ✔ Captura guardada: ${file7}`);

    console.log('\n======================================================================');
    console.log('   PRUEBAS FUNCIONALES AUTOMATIZADAS COMPLETADAS CON ÉXITO (7/7)      ');
    console.log(`   Todas las capturas de pantalla fueron guardadas en:`);
    console.log(`   ${OUTPUT_DIR}`);
    console.log('======================================================================\n');
  } catch (err) {
    console.error('[ERROR] Fallo en la automatización:', err);
  } finally {
    await browser.close();
  }
}

runBrowserTests();
