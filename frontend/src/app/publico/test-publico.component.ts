import { HttpErrorResponse } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, mensajeError } from '../core/api.service';
import { ResultadoEvaluacion } from '../core/models';
import { validar } from '../core/validacion';
import { IconComponent } from '../shared/icon.component';
import { LogoComponent } from '../shared/logo.component';
import { ResultadoComponent } from '../shared/resultado.component';
import { ThemeToggleComponent } from '../shared/theme-toggle.component';

type Paso = 'consentimiento' | 'edad' | 'sexo' | 'embarazos' | 'peso' | 'familia' | 'presion' | 'glucosa' | 'analizando' | 'resultado';
const PREGUNTAS: Paso[] = ['edad', 'sexo', 'embarazos', 'peso', 'familia', 'presion', 'glucosa'];
const ICONO: Record<string, string> = {
  edad: 'calendar', sexo: 'user', embarazos: 'baby', peso: 'scale', familia: 'users', presion: 'heart', glucosa: 'droplet',
};
const ETIQUETA: Record<string, string> = {
  edad: 'Edad', sexo: 'Sexo', embarazos: 'Embarazos', peso: 'Peso y talla', familia: 'Familia', presion: 'Presión', glucosa: 'Glucosa',
};

/** HU12: test público paso a paso, sin crear cuenta. */
@Component({
  selector: 'app-test-publico',
  imports: [FormsModule, RouterLink, DecimalPipe, IconComponent, LogoComponent, ResultadoComponent, ThemeToggleComponent],
  template: `
    <div class="test-shell">
      <header class="test-top no-print">
        <a routerLink="/" class="brand-link" aria-label="Volver al inicio"><app-logo /></a>
        <div class="test-top-r">
          <app-theme-toggle />
          <a routerLink="/" class="btn ghost small"><app-icon name="x" [size]="16" /> Salir</a>
        </div>
      </header>

      @if (esPregunta()) {
        <div class="stepper no-print" aria-label="Progreso">
          @for (p of pasos(); track p; let i = $index) {
            <span class="st" [class.done]="i < indice()" [class.now]="i === indice()">
              <i></i><small>{{ etiqueta(p) }}</small>
            </span>
          }
        </div>
      }

      <main class="test-main">
        @switch (paso()) {
          @case ('consentimiento') {
            <section class="qcard rise">
              <span class="qico"><app-icon name="shield" [size]="28" /></span>
              <h1 class="qtitle">Antes de empezar</h1>
              <p class="qhelp">El test dura 2 minutos. No te pediremos nombre ni DNI: cada test recibe un código anónimo.</p>
              <ul class="checklist">
                <li><app-icon name="check" [size]="18" /> 7 preguntas sencillas</li>
                <li><app-icon name="check" [size]="18" /> Presión y glucosa son opcionales</li>
                <li><app-icon name="check" [size]="18" /> El resultado es una estimación, no un diagnóstico</li>
              </ul>
              <label class="consent" [class.on]="datos.consentimiento">
                <input type="checkbox" [(ngModel)]="datos.consentimiento" name="consentimiento" (change)="error.set('')" />
                <span>Acepto que mis respuestas se usen de forma anónima para estimar mi riesgo y para la investigación, según la Ley N.° 29733 de Protección de Datos Personales.</span>
              </label>
              <p class="err" role="alert">{{ error() }}</p>
              <div class="qnav">
                <a routerLink="/" class="btn ghost"><app-icon name="arrow-left" [size]="18" /> Volver</a>
                <button class="btn" type="button" (click)="empezar()">Empezar <app-icon name="arrow-right" [size]="18" /></button>
              </div>
            </section>
          }

          @case ('analizando') {
            <section class="qcard center rise">
              <div class="loader" aria-hidden="true"><i></i><i></i><i></i></div>
              <h2>Analizando tus respuestas…</h2>
              <p class="qhelp">El modelo está calculando tu probabilidad de riesgo.</p>
            </section>
          }

          @case ('resultado') {
            <section class="res-wrap rise">
              @if (resultado(); as r) {
                <app-resultado [r]="r" (otro)="reiniciar()" />
              }
            </section>
          }

          @default {
            <form class="qcard rise" (ngSubmit)="siguiente()" novalidate>
              <div class="qhead">
                <span class="qico"><app-icon [name]="icono()" [size]="26" /></span>
                <span class="eyebrow">Pregunta {{ indice() + 1 }} de {{ pasos().length }}</span>
              </div>

              @switch (paso()) {
                @case ('edad') {
                  <h1 class="qtitle">¿Cuántos años tienes?</h1>
                  <p class="qhelp">El riesgo aumenta con la edad, sobre todo desde los 45 años.</p>
                  <div class="bignum" [class.bad]="error()">
                    <button type="button" class="round" (click)="sumar('edad', -1, 18, 100)" aria-label="Restar un año"><app-icon name="minus" /></button>
                    <input id="edad" name="edad" type="number" inputmode="numeric" [(ngModel)]="datos.edad" placeholder="--" autofocus />
                    <button type="button" class="round" (click)="sumar('edad', 1, 18, 100)" aria-label="Sumar un año"><app-icon name="plus" /></button>
                  </div>
                  <p class="hint center">años · entre 18 y 100</p>
                }
                @case ('sexo') {
                  <h1 class="qtitle">¿Cuál es tu sexo?</h1>
                  <p class="qhelp">Si eres mujer, te preguntaremos por tus embarazos.</p>
                  <div class="opts two">
                    <button type="button" class="opt" [attr.aria-pressed]="datos.sexo === 'F'" (click)="elegir('sexo', 'F')">
                      <span class="opt-ico"><app-icon name="female" [size]="28" /></span><b>Mujer</b>
                    </button>
                    <button type="button" class="opt" [attr.aria-pressed]="datos.sexo === 'M'" (click)="elegir('sexo', 'M')">
                      <span class="opt-ico"><app-icon name="male" [size]="28" /></span><b>Hombre</b>
                    </button>
                  </div>
                }
                @case ('embarazos') {
                  <h1 class="qtitle">¿Cuántas veces has estado embarazada?</h1>
                  <p class="qhelp">Cuenta todos los embarazos, aunque no hayan llegado a término. Si nunca, deja 0.</p>
                  <div class="bignum" [class.bad]="error()">
                    <button type="button" class="round" (click)="sumar('embarazos', -1, 0, 20)" aria-label="Restar"><app-icon name="minus" /></button>
                    <input id="embarazos" name="embarazos" type="number" inputmode="numeric" [(ngModel)]="datos.embarazos" />
                    <button type="button" class="round" (click)="sumar('embarazos', 1, 0, 20)" aria-label="Sumar"><app-icon name="plus" /></button>
                  </div>
                  <p class="hint center">veces · entre 0 y 20</p>
                }
                @case ('peso') {
                  <h1 class="qtitle">¿Cuánto pesas y cuánto mides?</h1>
                  <p class="qhelp">Con estos datos calculamos tu índice de masa corporal (IMC).</p>
                  <div class="row2">
                    <label class="field">
                      <span class="flabel">Peso</span>
                      <span class="inp lg"><input id="peso" name="peso" type="number" inputmode="decimal" [(ngModel)]="datos.pesoKg" placeholder="70" /><span class="unit">kg</span></span>
                    </label>
                    <label class="field">
                      <span class="flabel">Talla</span>
                      <span class="inp lg"><input id="talla" name="talla" type="number" inputmode="decimal" [(ngModel)]="datos.tallaCm" placeholder="165" /><span class="unit">cm</span></span>
                    </label>
                  </div>
                  <div class="imc-card">
                    <div class="imc-top">
                      <span>Tu IMC</span>
                      @if (imc(); as v) {
                        <b class="mono">{{ v | number: '1.1-1' }}</b><span [class]="'tag ' + claseImc(v)">{{ categoriaImc(v) }}</span>
                      } @else {
                        <span class="muted">aparecerá aquí</span>
                      }
                    </div>
                    <div class="imc-scale" aria-hidden="true">
                      <span class="s1">Bajo</span><span class="s2">Normal</span><span class="s3">Sobrepeso</span><span class="s4">Obesidad</span>
                      @if (imc(); as v) {
                        <i class="imc-pin" [style.left.%]="posImc(v)"></i>
                      }
                    </div>
                  </div>
                }
                @case ('familia') {
                  <h1 class="qtitle">¿Algún familiar tuyo tiene o tuvo diabetes?</h1>
                  <p class="qhelp">Elige la opción más cercana.</p>
                  <div class="opts">
                    @for (o of opcionesFamilia; track o.valor) {
                      <button type="button" class="opt row" [attr.aria-pressed]="datos.antecedenteFamiliar === o.valor" (click)="elegir('antecedenteFamiliar', o.valor)">
                        <span class="opt-ico"><app-icon [name]="o.icono" [size]="22" /></span>
                        <span class="opt-txt"><b>{{ o.titulo }}</b><small>{{ o.sub }}</small></span>
                        <span class="opt-check"><app-icon name="check" [size]="16" /></span>
                      </button>
                    }
                  </div>
                }
                @case ('presion') {
                  <h1 class="qtitle">¿Conoces tu presión arterial?</h1>
                  <p class="qhelp">Escribe el número de abajo (presión diastólica). Si tu presión es 120/80, escribe 80.</p>
                  <div class="bp-demo" aria-hidden="true"><span>120</span><i></i><b>80</b></div>
                  <label class="field narrow-field">
                    <span class="inp lg" [class.bad]="error()"><input id="presion" name="presion" type="number" inputmode="numeric" [(ngModel)]="datos.presion" placeholder="80" /><span class="unit">mmHg</span></span>
                  </label>
                }
                @case ('glucosa') {
                  <h1 class="qtitle">¿Tienes un análisis de glucosa reciente?</h1>
                  <p class="qhelp">Si te hiciste un análisis de sangre en el último año, escribe el valor de glucosa.</p>
                  <label class="field narrow-field">
                    <span class="inp lg" [class.bad]="error()"><input id="glucosa" name="glucosa" type="number" inputmode="decimal" [(ngModel)]="datos.glucosa" placeholder="95" /><span class="unit">mg/dL</span></span>
                  </label>
                }
              }

              <p class="err" role="alert">{{ error() }}</p>

              <div class="qnav">
                <button class="btn ghost" type="button" (click)="atras()"><app-icon name="arrow-left" [size]="18" /> Atrás</button>
                <div class="qnav-r">
                  @if (paso() === 'presion' || paso() === 'glucosa') {
                    <button class="link-btn" type="button" (click)="omitir()">{{ paso() === 'presion' ? 'No la conozco' : 'No tengo el dato' }}</button>
                  }
                  <button class="btn" type="submit">
                    {{ paso() === 'glucosa' ? 'Ver mi resultado' : 'Siguiente' }} <app-icon name="arrow-right" [size]="18" />
                  </button>
                </div>
              </div>
            </form>
          }
        }
      </main>
    </div>
  `,
})
export class TestPublicoComponent {
  private readonly api = inject(ApiService);

  readonly paso = signal<Paso>('consentimiento');
  readonly error = signal('');
  readonly resultado = signal<ResultadoEvaluacion | null>(null);

  datos = this.vacio();

  readonly opcionesFamilia = [
    { valor: 'Ninguno', titulo: 'Ninguno', sub: 'O no lo sé', icono: 'user' },
    { valor: 'Lejano', titulo: 'Abuelos, tíos o primos', sub: 'Familiares de segundo grado', icono: 'users' },
    { valor: 'Uno', titulo: 'Padre, madre o un hermano', sub: 'Un familiar directo', icono: 'heart' },
    { valor: 'Dos o más', titulo: 'Dos o más familiares directos', sub: 'Por ejemplo, padre y hermana', icono: 'users' },
  ];

  private vacio() {
    return {
      consentimiento: false,
      edad: null as number | null,
      sexo: '' as '' | 'F' | 'M',
      embarazos: 0 as number | null,
      pesoKg: null as number | null,
      tallaCm: null as number | null,
      antecedenteFamiliar: '',
      presion: null as number | null,
      glucosa: null as number | null,
    };
  }

  pasos(): Paso[] {
    return PREGUNTAS.filter((p) => p !== 'embarazos' || this.datos.sexo === 'F');
  }

  esPregunta(): boolean {
    return this.pasos().indexOf(this.paso()) >= 0;
  }

  indice(): number {
    return this.pasos().indexOf(this.paso());
  }

  icono(): string {
    return ICONO[this.paso()] ?? 'info';
  }

  etiqueta(p: string): string {
    return ETIQUETA[p] ?? p;
  }

  sumar(campo: 'edad' | 'embarazos', delta: number, min: number, max: number) {
    const base = Number(this.datos[campo] ?? (campo === 'edad' ? 40 : 0));
    const v = Math.min(max, Math.max(min, (Number.isFinite(base) ? base : min) + delta));
    this.datos[campo] = v;
    this.error.set('');
  }

  private avanzando = false;

  /** Marca la opción y pasa solo a la siguiente pregunta (evita saltos con doble clic). */
  elegir(campo: 'sexo' | 'antecedenteFamiliar', valor: string) {
    (this.datos as any)[campo] = valor;
    this.error.set('');
    if (this.avanzando) return;
    this.avanzando = true;
    setTimeout(() => {
      this.avanzando = false;
      this.siguiente();
    }, 220);
  }

  imc(): number | null {
    const p = Number(this.datos.pesoKg);
    const t = Number(this.datos.tallaCm);
    if (!p || !t) return null;
    const v = p / (t / 100) ** 2;
    return v > 8 && v < 90 ? v : null;
  }

  categoriaImc(v: number): string {
    return v < 18.5 ? 'Bajo peso' : v < 25 ? 'Normal' : v < 30 ? 'Sobrepeso' : 'Obesidad';
  }

  claseImc(v: number): string {
    return v < 18.5 ? 'mid' : v < 25 ? 'low' : v < 30 ? 'mid' : 'high';
  }

  /** Posición del marcador en la escala 15–40 de IMC. */
  posImc(v: number): number {
    return Math.min(98, Math.max(2, ((v - 15) / 25) * 100));
  }

  empezar() {
    if (!this.datos.consentimiento) {
      this.error.set('Para continuar, marca la casilla de consentimiento.');
      return;
    }
    this.error.set('');
    this.paso.set('edad');
  }

  atras() {
    this.error.set('');
    const lista = this.pasos();
    const i = lista.indexOf(this.paso());
    this.paso.set(i <= 0 ? 'consentimiento' : lista[i - 1]);
  }

  omitir() {
    if (this.paso() === 'presion') this.datos.presion = null;
    if (this.paso() === 'glucosa') this.datos.glucosa = null;
    this.avanzar();
  }

  siguiente() {
    const e = this.validarPaso();
    if (e) {
      this.error.set(e);
      return;
    }
    this.avanzar();
  }

  private validarPaso(): string | null {
    const d = this.datos;
    switch (this.paso()) {
      case 'edad':
        return validar('edad', d.edad);
      case 'sexo':
        return d.sexo ? null : 'Elige una opción para continuar.';
      case 'embarazos':
        return validar('embarazos', d.embarazos);
      case 'peso': {
        const e = validar('pesoKg', d.pesoKg) ?? validar('tallaCm', d.tallaCm);
        if (e) return e;
        const v = this.imc();
        return v && v >= 12 && v <= 70 ? null : 'El IMC calculado no es válido. Revisa el peso y la talla.';
      }
      case 'familia':
        return d.antecedenteFamiliar ? null : 'Elige una opción para continuar.';
      case 'presion':
        return validar('presion', d.presion, true);
      case 'glucosa':
        return validar('glucosa', d.glucosa, true);
      default:
        return null;
    }
  }

  private avanzar() {
    this.error.set('');
    const lista = this.pasos();
    const i = lista.indexOf(this.paso());
    if (i < 0) return;
    if (i >= lista.length - 1) {
      this.enviar();
    } else {
      this.paso.set(lista[i + 1]);
    }
  }

  private enviar() {
    const d = this.datos;
    const vacio = (v: unknown) => v === null || v === undefined || v === '';
    const cuerpo: Record<string, unknown> = {
      sexo: d.sexo,
      edad: Number(d.edad),
      pesoKg: Number(d.pesoKg),
      tallaCm: Number(d.tallaCm),
      antecedenteFamiliar: d.antecedenteFamiliar,
      presion: vacio(d.presion) ? null : Number(d.presion),
      glucosa: vacio(d.glucosa) ? null : Number(d.glucosa),
      consentimiento: true,
    };
    if (d.sexo === 'F') cuerpo['embarazos'] = Number(d.embarazos ?? 0);

    const ultimo: Paso = 'glucosa';
    this.paso.set('analizando');
    const inicio = Date.now();
    this.api.evaluarPublica(cuerpo).subscribe({
      next: (r) => {
        const espera = Math.max(0, 1100 - (Date.now() - inicio));
        setTimeout(() => {
          this.resultado.set(r);
          this.paso.set('resultado');
        }, espera);
      },
      error: (err: HttpErrorResponse) => {
        this.paso.set(ultimo);
        this.error.set(mensajeError(err));
      },
    });
  }

  reiniciar() {
    this.datos = this.vacio();
    this.resultado.set(null);
    this.error.set('');
    this.paso.set('consentimiento');
  }
}
