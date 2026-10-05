import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GaugeComponent } from '../shared/gauge.component';
import { IconComponent } from '../shared/icon.component';
import { LogoComponent } from '../shared/logo.component';
import { SiteHeaderComponent } from '../shared/site-header.component';

/** Página de inicio pública. */
@Component({
  selector: 'app-landing',
  imports: [RouterLink, GaugeComponent, IconComponent, LogoComponent, SiteHeaderComponent],
  template: `
    <app-site-header />

    <main>
      <section class="hero">
        <div class="hero-bg" aria-hidden="true"></div>
        <div class="wrap hero-in">
          <div class="hero-copy rise">
            <span class="pill"><app-icon name="sparkles" [size]="14" /> Urbanización Los Cedros de Villa · Chorrillos</span>
            <h1>Conoce tu riesgo de <span class="hl">diabetes tipo 2</span> en 2 minutos</h1>
            <p class="lead">Responde 7 preguntas sencillas. Un modelo de inteligencia artificial estima tu riesgo, te muestra qué factores lo aumentan y qué puedes hacer hoy.</p>
            <div class="hero-ctas">
              <a routerLink="/test" class="btn lg">Hacer el test gratis <app-icon name="arrow-right" [size]="18" /></a>
              <a routerLink="/" fragment="como-funciona" class="btn ghost lg">Cómo funciona</a>
            </div>
            <ul class="trust">
              <li><app-icon name="shield" [size]="16" /> Anónimo: sin nombre ni DNI</li>
              <li><app-icon name="clock" [size]="16" /> 2 minutos</li>
              <li><app-icon name="heart" [size]="16" /> Desde tu celular</li>
            </ul>
          </div>

          <div class="hero-visual rise d2" aria-hidden="true">
            <figure class="hero-photo">
              <img src="hero-ilustracion.svg" alt="" width="360" height="440" />
            </figure>
            <div class="preview">
              <div class="preview-head"><span class="eyebrow">Ejemplo de resultado</span><span class="level Moderado">Moderado</span></div>
              <app-gauge [valor]="0.186" nivel="Moderado" [size]="132" caption="riesgo" />
              <div class="preview-rows">
                <div><span>IMC</span><span class="mini"><i style="width:82%" class="up"></i></span></div>
                <div><span>Edad</span><span class="mini"><i style="width:58%" class="up"></i></span></div>
                <div><span>Actividad</span><span class="mini"><i style="width:34%" class="down"></i></span></div>
              </div>
            </div>
            <div class="float-chip c1"><app-icon name="heart" [size]="16" /> Hecho para Los Cedros</div>
            <div class="float-chip c2"><app-icon name="lock" [size]="16" /> Datos anónimos</div>
          </div>
        </div>
      </section>

      <section class="band">
        <div class="wrap">
          <p class="band-title">En Lima Metropolitana, entre personas de 15 años a más</p>
          <div class="stats">
            <div class="stat"><b>42,9 %</b><span>tiene al menos una comorbilidad: obesidad, diabetes o hipertensión</span></div>
            <div class="stat"><b>38,1 %</b><span>presenta sobrepeso</span></div>
            <div class="stat"><b>20,6 %</b><span>tiene hipertensión arterial</span></div>
          </div>
          <p class="source">Fuente: INEI, Encuesta Demográfica y de Salud Familiar (ENDES) 2023.</p>
        </div>
      </section>

      <section class="section" id="como-funciona">
        <div class="wrap">
          <div class="section-head">
            <span class="eyebrow">Cómo funciona</span>
            <h2>Tres pasos, sin análisis de laboratorio</h2>
          </div>
          <ol class="steps3">
            <li>
              <span class="step-n">1</span>
              <app-icon name="list" [size]="26" />
              <h3>Respondes 7 preguntas</h3>
              <p class="muted">Edad, peso y talla, antecedentes familiares y, si los conoces, tu presión y tu glucosa.</p>
            </li>
            <li>
              <span class="step-n">2</span>
              <app-icon name="activity" [size]="26" />
              <h3>La IA estima tu riesgo</h3>
              <p class="muted">Un modelo Random Forest calcula la probabilidad y los factores que más pesan en tu caso.</p>
            </li>
            <li>
              <span class="step-n">3</span>
              <app-icon name="sparkles" [size]="26" />
              <h3>Recibes tu resultado</h3>
              <p class="muted">Tu nivel de riesgo (bajo, moderado o alto) con recomendaciones claras para actuar.</p>
            </li>
          </ol>
        </div>
      </section>

      <section class="section alt" id="factores">
        <div class="wrap">
          <div class="section-head">
            <span class="eyebrow">Factores de riesgo</span>
            <h2>Lo que más influye en la diabetes tipo 2</h2>
            <p class="muted">Algunos no se pueden cambiar, pero la mayoría sí.</p>
          </div>
          <div class="cards6">
            <div class="fcard"><span class="fico"><app-icon name="calendar" /></span><h3>Edad</h3><p class="muted">El riesgo sube con los años, sobre todo desde los 45.</p></div>
            <div class="fcard"><span class="fico"><app-icon name="scale" /></span><h3>Sobrepeso</h3><p class="muted">Un IMC de 25 o más aumenta el riesgo; de 30 o más, mucho más.</p></div>
            <div class="fcard"><span class="fico"><app-icon name="users" /></span><h3>Familia</h3><p class="muted">Tener padres o hermanos con diabetes eleva tu riesgo.</p></div>
            <div class="fcard"><span class="fico"><app-icon name="heart" /></span><h3>Presión alta</h3><p class="muted">La hipertensión suele acompañar a la diabetes.</p></div>
            <div class="fcard"><span class="fico"><app-icon name="droplet" /></span><h3>Glucosa elevada</h3><p class="muted">Valores altos en análisis previos son una señal de alerta.</p></div>
            <div class="fcard"><span class="fico"><app-icon name="run" /></span><h3>Sedentarismo</h3><p class="muted">Moverte 150 minutos por semana ayuda a prevenirla.</p></div>
          </div>
        </div>
      </section>

      <section class="section" id="preguntas">
        <div class="wrap narrow">
          <div class="section-head">
            <span class="eyebrow">Preguntas frecuentes</span>
            <h2>Antes de empezar</h2>
          </div>
          <div class="faq">
            <details open>
              <summary>¿El resultado es un diagnóstico?</summary>
              <p>No. Es una estimación del riesgo. Solo un profesional de salud puede diagnosticar la diabetes con análisis de laboratorio.</p>
            </details>
            <details>
              <summary>¿Guardan mis datos personales?</summary>
              <p>No pedimos nombre, DNI ni teléfono. Cada test recibe un código anónimo y los datos se tratan según la Ley N.° 29733 de Protección de Datos Personales.</p>
            </details>
            <details>
              <summary>¿Qué hago si mi riesgo sale alto?</summary>
              <p>Acude a tu establecimiento de salud y pide una prueba de glucosa o de hemoglobina glicosilada (HbA1c). Lleva tu resultado.</p>
            </details>
            <details>
              <summary>No sé mi presión ni mi glucosa, ¿igual puedo hacerlo?</summary>
              <p>Sí. Esas preguntas son opcionales. Si no las respondes, el sistema usa un valor típico y te lo indica en el resultado.</p>
            </details>
          </div>
        </div>
      </section>

      <section class="cta-band">
        <div class="wrap cta-in">
          <div>
            <h2>¿Listo para conocer tu riesgo?</h2>
            <p>Gratis, anónimo y en 2 minutos.</p>
          </div>
          <a routerLink="/test" class="btn lg inverse">Empezar ahora <app-icon name="arrow-right" [size]="18" /></a>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <div class="wrap foot-in">
        <app-logo />
        <p class="muted">Software web para la estimación del riesgo de diabetes mellitus tipo 2 en adultos de la Urbanización Los Cedros de Villa, Chorrillos, 2026. Proyecto académico. No reemplaza la consulta médica.</p>
        <a routerLink="/login" class="muted">Acceso del personal de salud</a>
      </div>
    </footer>
  `,
})
export class LandingComponent {}
