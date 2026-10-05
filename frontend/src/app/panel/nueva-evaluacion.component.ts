import { HttpErrorResponse } from '@angular/common/http';
import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, mensajeError } from '../core/api.service';
import { ResultadoEvaluacion } from '../core/models';
import { RANGOS, validar } from '../core/validacion';
import { IconComponent } from '../shared/icon.component';
import { ResultadoComponent } from '../shared/resultado.component';

type IdCampo = 'edad' | 'embarazos' | 'glucosa' | 'presion' | 'imc' | 'pedigree' | 'insulina' | 'pliegue';

interface Campo {
  id: IdCampo;
  etiqueta: string;
  unidad: string;
  opcional: boolean;
  icono: string;
}

/** HU01–HU04: el personal registra las 8 variables y obtiene el nivel de riesgo. */
@Component({
  selector: 'app-nueva-evaluacion',
  imports: [FormsModule, DecimalPipe, NgTemplateOutlet, IconComponent, ResultadoComponent],
  template: `
    <div class="page-head">
      <div>
        <span class="eyebrow">HU01 · HU02 · HU03 · HU04</span>
        <h1>Nueva evaluación</h1>
        <p class="muted">Se genera un código anónimo para el participante. No se registran nombres ni DNI.</p>
      </div>
      <div class="page-head-r">
        <button class="btn ghost" type="button" (click)="ejemplo()"><app-icon name="sparkles" [size]="18" /> Cargar ejemplo</button>
      </div>
    </div>

    <div class="eval-grid">
      <form class="card form-card" (ngSubmit)="calcular()" novalidate>
        <fieldset class="fs">
          <legend><app-icon name="user" [size]="18" /> Datos del participante</legend>
          <div class="field">
            <span class="flabel">Sexo</span>
            <div class="seg">
              <button type="button" [attr.aria-pressed]="sexo === 'F'" (click)="sexo = 'F'"><app-icon name="female" [size]="16" /> Mujer</button>
              <button type="button" [attr.aria-pressed]="sexo === 'M'" (click)="sexo = 'M'; valores.embarazos = 0"><app-icon name="male" [size]="16" /> Hombre</button>
            </div>
          </div>
          <div class="grid-fields">
            @for (c of grupo1; track c.id) {
              <ng-container *ngTemplateOutlet="campo; context: { $implicit: c }" />
            }
          </div>
        </fieldset>

        <fieldset class="fs">
          <legend><app-icon name="stethoscope" [size]="18" /> Medidas clínicas</legend>
          <div class="grid-fields">
            @for (c of grupo2; track c.id) {
              <ng-container *ngTemplateOutlet="campo; context: { $implicit: c }" />
            }
          </div>
          <details class="helper">
            <summary><app-icon name="scale" [size]="16" /> Calcular IMC con peso y talla</summary>
            <div class="helper-row">
              <span class="inp sm"><input type="number" name="hpeso" [(ngModel)]="pesoAux" placeholder="Peso" /><span class="unit">kg</span></span>
              <span class="inp sm"><input type="number" name="htalla" [(ngModel)]="tallaAux" placeholder="Talla" /><span class="unit">cm</span></span>
              <button type="button" class="btn ghost small" (click)="calcularImc()">Usar IMC</button>
            </div>
          </details>
          <details class="helper">
            <summary><app-icon name="users" [size]="16" /> Estimar el antecedente familiar</summary>
            <div class="chips">
              @for (o of familia; track o.valor) {
                <button type="button" class="chip" [attr.aria-pressed]="valores.pedigree === o.valor" (click)="valores.pedigree = o.valor">{{ o.titulo }} · {{ o.valor }}</button>
              }
            </div>
          </details>
        </fieldset>

        <fieldset class="fs">
          <legend><app-icon name="droplet" [size]="18" /> Laboratorio (opcional)</legend>
          <div class="grid-fields">
            @for (c of grupo3; track c.id) {
              <ng-container *ngTemplateOutlet="campo; context: { $implicit: c }" />
            }
          </div>
          <p class="note"><app-icon name="info" [size]="14" /> Los campos vacíos se completan con la mediana del dataset (HU03).</p>
        </fieldset>

        @if (error()) {
          <div class="alert" role="alert"><app-icon name="alert" [size]="18" /> {{ error() }}</div>
        }

        <div class="row-btns">
          <button class="btn lg" type="submit" [disabled]="cargando()">
            @if (cargando()) {
              <span class="spin"></span> Calculando…
            } @else {
              <app-icon name="activity" [size]="18" /> Calcular riesgo
            }
          </button>
          <button class="btn ghost lg" type="button" (click)="limpiar()">Limpiar</button>
        </div>

        <ng-template #campo let-c>
          <label class="field">
            <span class="flabel">{{ c.etiqueta }} @if (c.opcional) {<em class="opt-tag">opcional</em>}</span>
            <span class="inp" [class.bad]="errores()[c.id]">
              <input [id]="'f-' + c.id" [name]="c.id" type="number" step="any" [(ngModel)]="valores[c.id]"
                     [disabled]="c.id === 'embarazos' && sexo === 'M'" [placeholder]="rango(c.id)" />
              <span class="unit">{{ c.unidad }}</span>
            </span>
            @if (errores()[c.id]) {
              <span class="err">{{ errores()[c.id] }}</span>
            } @else {
              <span class="hint mono">{{ rango(c.id) }}</span>
            }
          </label>
        </ng-template>
      </form>

      <section class="eval-res">
        @if (resultado(); as r) {
          <div class="rise"><app-resultado [r]="r" [modoPersonal]="true" /></div>
        } @else {
          <div class="card empty-state">
            <span class="empty-ico"><app-icon name="gauge" [size]="34" /></span>
            <h3>El resultado aparecerá aquí</h3>
            <p class="muted">Complete los datos y presione “Calcular riesgo”. La evaluación se guarda automáticamente en el historial.</p>
            @if (ultimos().length) {
              <div class="last-list">
                <span class="eyebrow">En esta sesión</span>
                @for (u of ultimos(); track u.idEvaluacion) {
                  <div class="last-row"><span class="mono">{{ u.codigo }}</span><span [class]="'level small ' + u.nivel">{{ u.nivel }}</span><span class="mono">{{ u.probabilidad * 100 | number: '1.1-1' }} %</span></div>
                }
              </div>
            }
          </div>
        }
      </section>
    </div>
  `,
})
export class NuevaEvaluacionComponent {
  private readonly api = inject(ApiService);

  readonly grupo1: Campo[] = [
    { id: 'edad', etiqueta: 'Edad', unidad: 'años', opcional: false, icono: 'calendar' },
    { id: 'embarazos', etiqueta: 'Embarazos', unidad: 'veces', opcional: false, icono: 'baby' },
  ];
  readonly grupo2: Campo[] = [
    { id: 'imc', etiqueta: 'IMC', unidad: 'kg/m²', opcional: false, icono: 'scale' },
    { id: 'pedigree', etiqueta: 'Antecedente familiar', unidad: 'índice', opcional: false, icono: 'users' },
    { id: 'presion', etiqueta: 'Presión diastólica', unidad: 'mmHg', opcional: true, icono: 'heart' },
  ];
  readonly grupo3: Campo[] = [
    { id: 'glucosa', etiqueta: 'Glucosa', unidad: 'mg/dL', opcional: true, icono: 'droplet' },
    { id: 'insulina', etiqueta: 'Insulina', unidad: 'µU/mL', opcional: true, icono: 'droplet' },
    { id: 'pliegue', etiqueta: 'Pliegue cutáneo', unidad: 'mm', opcional: true, icono: 'ruler' },
  ];
  readonly familia = [
    { titulo: 'Ninguno', valor: 0.2 },
    { titulo: 'Abuelos, tíos', valor: 0.35 },
    { titulo: 'Padre, madre o hermano', valor: 0.55 },
    { titulo: 'Dos o más directos', valor: 0.85 },
  ];

  sexo: 'F' | 'M' = 'F';
  valores: Record<string, number | null> = this.vacio();
  pesoAux: number | null = null;
  tallaAux: number | null = null;
  readonly errores = signal<Record<string, string>>({});
  readonly error = signal('');
  readonly cargando = signal(false);
  readonly resultado = signal<ResultadoEvaluacion | null>(null);
  readonly ultimos = signal<ResultadoEvaluacion[]>([]);

  private todos(): Campo[] {
    return [...this.grupo1, ...this.grupo2, ...this.grupo3];
  }

  private vacio(): Record<string, number | null> {
    return { edad: null, embarazos: null, glucosa: null, presion: null, imc: null, pedigree: null, insulina: null, pliegue: null };
  }

  rango(id: string): string {
    const r = RANGOS[id];
    return `${String(r.min).replace('.', ',')} – ${String(r.max).replace('.', ',')}`;
  }

  calcularImc() {
    const p = Number(this.pesoAux);
    const t = Number(this.tallaAux);
    if (!p || !t) return;
    this.valores['imc'] = Math.round((p / (t / 100) ** 2) * 10) / 10;
  }

  limpiar() {
    this.valores = this.vacio();
    this.errores.set({});
    this.error.set('');
    if (this.resultado()) this.ultimos.update((u) => [this.resultado() as ResultadoEvaluacion, ...u].slice(0, 5));
    this.resultado.set(null);
  }

  ejemplo() {
    this.sexo = 'F';
    this.valores = { edad: 52, embarazos: 3, glucosa: 148, presion: 84, imc: 31.6, pedigree: 0.55, insulina: null, pliegue: null };
    this.errores.set({});
    this.error.set('');
  }

  calcular() {
    if (this.sexo === 'M') this.valores['embarazos'] = 0;
    const errores: Record<string, string> = {};
    for (const c of this.todos()) {
      const e = validar(c.id, this.valores[c.id], c.opcional);
      if (e) errores[c.id] = e;
    }
    this.errores.set(errores);
    if (Object.keys(errores).length) {
      this.error.set('Revise los campos marcados en rojo.');
      return;
    }

    const num = (v: number | null) => (v === null || (v as unknown) === '' ? null : Number(v));
    const cuerpo = {
      sexo: this.sexo,
      edad: Number(this.valores['edad']),
      embarazos: Number(this.valores['embarazos']),
      glucosa: num(this.valores['glucosa']),
      presion: num(this.valores['presion']),
      insulina: num(this.valores['insulina']),
      pliegue: num(this.valores['pliegue']),
      imc: Number(this.valores['imc']),
      pedigree: Number(this.valores['pedigree']),
    };

    this.error.set('');
    this.cargando.set(true);
    this.api.evaluarPersonal(cuerpo).subscribe({
      next: (r) => {
        this.resultado.set(r);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }
}
