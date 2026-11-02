import { DecimalPipe, NgClass } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService, mensajeError } from '../core/api.service';
import { DimensionCatalogo, FilaHistorial, ResumenEncuesta } from '../core/models';
import { IconComponent } from '../shared/icon.component';

const OPCIONES_LIKERT = [
  { valor: 1, texto: 'Totalmente en desacuerdo', corto: '1' },
  { valor: 2, texto: 'En desacuerdo', corto: '2' },
  { valor: 3, texto: 'Neutral', corto: '3' },
  { valor: 4, texto: 'De acuerdo', corto: '4' },
  { valor: 5, texto: 'Totalmente de acuerdo', corto: '5' },
];

@Component({
  selector: 'app-encuesta',
  imports: [FormsModule, DecimalPipe, NgClass, IconComponent],
  template: `
    <div class="page-head">
      <div>
        <span class="eyebrow">Variable X · Instrumento de Tesis (ISO/IEC 25010)</span>
        <h1>Calidad del Software</h1>
        <p class="muted">
          Cuestionario de evaluación técnica en 4 dimensiones e indicadores de calidad para contrastación de hipótesis.
        </p>
      </div>
      <div class="page-head-r">
        <div class="seg">
          <button type="button" [attr.aria-pressed]="pestana() === 'responder'" (click)="pestana.set('responder')">
            <app-icon name="file" [size]="16" /> Responder cuestionario
          </button>
          <button type="button" [attr.aria-pressed]="pestana() === 'resultados'" (click)="abrirResultados()">
            <app-icon name="chart" [size]="16" /> Resultados y métricas
          </button>
        </div>
      </div>
    </div>

    @if (error()) {
      <div class="alert" role="alert">
        <app-icon name="alert" [size]="18" /> {{ error() }}
      </div>
    }

    @if (exito()) {
      <div class="alert alert-success" role="status">
        <app-icon name="check" [size]="18" />
        ¡Encuesta registrada correctamente para la evaluación seleccionada! Los resultados se actualizaron.
      </div>
    }

    <!-- PESTAÑA 1: RESPONDER CUESTIONARIO -->
    @if (pestana() === 'responder') {
      <div class="enc-wrap">
        <!-- Selector de Evaluación Vinculada -->
        <section class="card sel-card">
          <div class="card-head">
            <h3><app-icon name="user" [size]="18" /> Evaluación clínica a calificar</h3>
            <span class="prog-tag" [class.done]="completa()">
              {{ respondidasCount() }} de {{ totalPreguntas() }} preguntas respondidas
            </span>
          </div>

          <div class="eval-selector-row">
            <label class="field sel-field">
              <span class="flabel">Seleccione una evaluación registrada recientemente:</span>
              <select class="select" [(ngModel)]="idEvaluacionSeleccionada" (ngModelChange)="cargarRespuestasExistentes()">
                <option [ngValue]="null" disabled>-- Seleccione una evaluación --</option>
                @for (ev of evaluaciones(); track ev.idEvaluacion) {
                  <option [ngValue]="ev.idEvaluacion">
                    {{ ev.codigo }} · Riesgo {{ ev.nivel }} ({{ ev.probabilidad * 100 | number: '1.0-0' }}%) · {{ ev.canal }} · {{ ev.fechaHora }}
                  </option>
                }
              </select>
            </label>
            @if (idEvaluacionSeleccionada) {
              <div class="id-badge">
                <span class="muted small">ID Evaluación</span>
                <b>#{{ idEvaluacionSeleccionada }}</b>
              </div>
            }
          </div>
        </section>

        <!-- Formulario de 4 Dimensiones x 3 Indicadores -->
        <form (ngSubmit)="guardar()" class="enc-form">
          @for (dim of catalogo(); track dim.dimension) {
            <section class="card dim-card">
              <div class="dim-head">
                <div class="dim-title">
                  <span class="dim-badge">{{ dim.dimension }}</span>
                  <p class="muted small">{{ getDescripcionDimension(dim.dimension) }}</p>
                </div>
              </div>

              <div class="ind-list">
                @for (ind of dim.indicadores; track ind.indicador) {
                  <div class="ind-row" [class.unanswered]="!getPuntaje(dim.dimension, ind.indicador)">
                    <div class="ind-info">
                      <div class="ind-top">
                        <b>{{ ind.indicador }}</b>
                      </div>
                      <p class="ind-preg">{{ ind.pregunta }}</p>
                      <span class="hint small muted">{{ ind.descripcion }}</span>
                    </div>

                    <!-- Escala Likert 1 a 5 -->
                    <div class="likert-group">
                      @for (op of opcionesLikert; track op.valor) {
                        <button
                          type="button"
                          class="likert-btn"
                          [class.sel]="getPuntaje(dim.dimension, ind.indicador) === op.valor"
                          [attr.aria-pressed]="getPuntaje(dim.dimension, ind.indicador) === op.valor"
                          (click)="setPuntaje(dim.dimension, ind.indicador, op.valor)"
                          [title]="op.texto"
                        >
                          <span class="likert-num">{{ op.valor }}</span>
                          <span class="likert-txt">{{ op.texto }}</span>
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            </section>
          }

          <div class="form-actions-bar card">
            <div class="prog-info">
              <div class="prog-bar">
                <div class="prog-fill" [style.width.%]="(respondidasCount() / totalPreguntas()) * 100"></div>
              </div>
              <span class="muted small">
                <b>{{ respondidasCount() }} de {{ totalPreguntas() }}</b> ítems calificados
                @if (promedioSesion() > 0) {
                  · Promedio actual: <b>{{ promedioSesion() | number: '1.2-2' }} / 5.00</b>
                }
              </span>
            </div>

            <div class="act-btns">
              <button
                type="submit"
                class="btn lg"
                [disabled]="!completa() || !idEvaluacionSeleccionada || guardando()"
              >
                @if (guardando()) {
                  <span class="spin"></span> Guardando…
                } @else {
                  <app-icon name="check" [size]="18" /> Registrar evaluación ISO 25010
                }
              </button>
            </div>
          </div>
        </form>
      </div>
    }

    <!-- PESTAÑA 2: RESULTADOS Y MÉTRICAS DE LA TESIS -->
    @if (pestana() === 'resultados') {
      <div class="resumen-wrap">
        @if (cargandoResumen()) {
          <div class="card empty-state">
            <span class="spin"></span>
            <p>Cargando métricas de la tesis…</p>
          </div>
        } @else if (resumen(); as r) {
          <!-- KPIs Globales -->
          <div class="kpis">
            <div class="kpi">
              <span class="kpi-ico"><app-icon name="activity" /></span>
              <span class="kpi-lbl">Promedio General (Likert)</span>
              <b class="kpi-num">{{ r.global.promedioGeneral ? (r.global.promedioGeneral | number: '1.2-2') : 'S/D' }}</b>
              <span class="muted small">Escala de 1.0 a 5.0</span>
            </div>
            <div class="kpi tone-Bajo">
              <span class="kpi-ico"><app-icon name="check" /></span>
              <span class="kpi-lbl">Evaluaciones Calificadas</span>
              <b class="kpi-num">{{ r.global.totalEvaluaciones }}</b>
              <span class="muted small">participantes evaluados</span>
            </div>
            <div class="kpi tone-Moderado">
              <span class="kpi-ico"><app-icon name="list" /></span>
              <span class="kpi-lbl">Ítems Registrados</span>
              <b class="kpi-num">{{ r.global.totalRespuestas }}</b>
              <span class="muted small">respuestas en base de datos</span>
            </div>
            <div class="kpi tone-Alto">
              <span class="kpi-ico"><app-icon name="shield" /></span>
              <span class="kpi-lbl">Nivel de Calidad</span>
              <b class="kpi-num" style="font-size: 1.4rem;">{{ getNivelCalidadTexto(r.global.promedioGeneral) }}</b>
              <span class="muted small">Criterio ISO 25010</span>
            </div>
          </div>

          <!-- Cards de las 4 Dimensiones -->
          <div class="dim-summary-grid">
            @for (d of r.porDimension; track d.dimension) {
              <div class="card dim-stat-card">
                <div class="card-head">
                  <h4>{{ d.dimension }}</h4>
                  <b class="dim-score">{{ d.promedio | number: '1.2-2' }} <small>/ 5</small></b>
                </div>
                <div class="prog-bar lg">
                  <div class="prog-fill" [style.width.%]="(d.promedio / 5) * 100"></div>
                </div>
                <div class="card-foot muted small">
                  <span>{{ d.total }} respuestas</span>
                  <span>{{ (d.promedio / 5) * 100 | number: '1.0-0' }}% de satisfacción</span>
                </div>
              </div>
            }
          </div>

          <!-- Tabla Detallada de los 12 Indicadores -->
          <section class="card">
            <div class="card-head">
              <div>
                <h3>Matriz de Indicadores de la Variable X (Software Web)</h3>
                <p class="muted small">
                  Valores observados para contraste empírico de las hipótesis específicas.
                </p>
              </div>
              <button type="button" class="btn ghost small" (click)="exportarCsv()">
                <app-icon name="download" [size]="16" /> Exportar para informe de tesis (CSV)
              </button>
            </div>

            <div class="tablewrap flat">
              <table class="table">
                <thead>
                  <tr>
                    <th>Dimensión</th>
                    <th>Indicador</th>
                    <th class="tr">Promedio Likert</th>
                    <th class="tr">% Logro</th>
                    <th class="tr">Total Respuestas</th>
                    <th>Interpretación</th>
                  </tr>
                </thead>
                <tbody>
                  @for (ind of r.porIndicador; track ind.dimension + ind.indicador) {
                    <tr>
                      <td><b>{{ ind.dimension }}</b></td>
                      <td>{{ ind.indicador }}</td>
                      <td class="tr mono"><b>{{ ind.promedio | number: '1.2-2' }}</b></td>
                      <td class="tr mono">{{ (ind.promedio / 5) * 100 | number: '1.1-1' }}%</td>
                      <td class="tr mono">{{ ind.total }}</td>
                      <td>
                        <span class="level small" [ngClass]="getBadgeClass(ind.promedio)">
                          {{ getInterpretacion(ind.promedio) }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>

          <!-- Distribución de Puntajes Likert (1 a 5) -->
          <section class="card">
            <div class="card-head">
              <h3>Distribución de Frecuencias Likert</h3>
              <span class="muted small">Total respuestas por puntaje</span>
            </div>
            <div class="likert-dist-grid">
              @for (dist of r.distribucion; track dist.puntaje) {
                <div class="dist-col">
                  <span class="dist-cnt mono">{{ dist.cantidad }}</span>
                  <div class="dist-bar-track">
                    <div
                      class="dist-bar-fill"
                      [style.height.%]="r.global.totalRespuestas > 0 ? (dist.cantidad / r.global.totalRespuestas) * 100 : 0"
                    ></div>
                  </div>
                  <b class="dist-label">★ {{ dist.puntaje }}</b>
                </div>
              }
            </div>
          </section>
        } @else {
          <div class="card empty-state">
            <p class="muted">No hay respuestas registradas aún en la base de datos.</p>
          </div>
        }
      </div>
    }
  `,
  styles: [
    `
      .enc-wrap, .resumen-wrap { display: flex; flex-direction: column; gap: 20px; }
      .sel-card { padding: 16px 20px; }
      .eval-selector-row { display: flex; align-items: center; gap: 16px; margin-top: 8px; }
      .sel-field { flex: 1; }
      .id-badge {
        display: flex; flex-direction: column; align-items: center;
        background: var(--sunken); padding: 8px 14px; border-radius: 12px;
      }
      .prog-tag {
        font: 700 0.8rem var(--f-mono); background: var(--sunken);
        color: var(--muted); padding: 4px 10px; border-radius: 99px;
      }
      .prog-tag.done { background: var(--low-soft, #e6f4ea); color: var(--low, #137333); }

      .dim-card { display: flex; flex-direction: column; gap: 16px; margin-bottom: 20px; }
      .dim-head { border-bottom: 1px solid var(--line); padding-bottom: 12px; }
      .dim-badge {
        display: inline-block; font-weight: 800; font-size: 1.05rem;
        color: var(--brand); margin-bottom: 4px;
      }

      .ind-list { display: flex; flex-direction: column; gap: 18px; }
      .ind-row {
        display: grid; grid-template-columns: 1fr auto; gap: 20px; align-items: center;
        padding: 14px; background: var(--sunken); border-radius: 12px; border: 1px solid transparent;
      }
      .ind-row.unanswered { border-color: color-mix(in srgb, var(--line) 80%, transparent); }
      .ind-preg { font-weight: 600; font-size: 0.95rem; margin: 4px 0 2px 0; color: var(--ink); }

      .likert-group { display: flex; gap: 8px; flex-wrap: wrap; }
      .likert-btn {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        width: 64px; height: 60px; border: 1px solid var(--line); border-radius: 12px;
        background: var(--surface); cursor: pointer; transition: all 0.15s ease;
      }
      .likert-num { font: 800 1.25rem var(--f-display); color: var(--muted); }
      .likert-txt { font-size: 0.55rem; text-align: center; color: var(--muted); line-height: 1.1; max-width: 54px; }
      .likert-btn:hover { border-color: var(--brand); transform: translateY(-2px); }
      .likert-btn.sel {
        background: var(--brand); border-color: var(--brand); box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      .likert-btn.sel .likert-num, .likert-btn.sel .likert-txt { color: #fff; font-weight: 700; }

      .form-actions-bar {
        position: sticky; bottom: 20px; display: flex; justify-content: space-between;
        align-items: center; padding: 16px 24px; box-shadow: 0 8px 30px rgba(0,0,0,0.12);
        z-index: 10;
      }
      .prog-info { display: flex; flex-direction: column; gap: 6px; width: 300px; }
      .prog-bar {
        height: 8px; background: var(--sunken); border-radius: 99px; overflow: hidden;
      }
      .prog-bar.lg { height: 10px; margin: 10px 0; }
      .prog-fill {
        height: 100%; background: var(--brand); border-radius: 99px; transition: width 0.3s ease;
      }

      .alert-success {
        background: #e6f4ea; color: #137333; display: flex; align-items: center;
        gap: 10px; border-radius: 12px; padding: 12px 14px; font-weight: 700;
      }

      /* Resumen */
      .dim-summary-grid {
        display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px;
      }
      .dim-stat-card { display: flex; flex-direction: column; justify-content: space-between; }
      .dim-score { font: 800 1.6rem var(--f-display); color: var(--brand); }
      .card-foot { display: flex; justify-content: space-between; border-top: 1px solid var(--line); padding-top: 8px; }

      .likert-dist-grid {
        display: flex; justify-content: space-around; align-items: flex-end; height: 160px;
        padding-top: 20px;
      }
      .dist-col { display: flex; flex-direction: column; align-items: center; gap: 8px; width: 60px; height: 100%; justify-content: flex-end; }
      .dist-bar-track { width: 32px; height: 100px; background: var(--sunken); border-radius: 8px; display: flex; align-items: flex-end; overflow: hidden; }
      .dist-bar-fill { width: 100%; background: var(--brand); border-radius: 8px 8px 0 0; min-height: 4px; transition: height 0.5s ease; }
      .dist-cnt { font-size: 0.85rem; font-weight: 700; }
      .dist-label { font-size: 0.85rem; color: var(--muted); }

      @media (max-width: 768px) {
        .ind-row { grid-template-columns: 1fr; }
        .form-actions-bar { flex-direction: column; gap: 14px; align-items: stretch; position: static; }
        .prog-info { width: 100%; }
      }
    `,
  ],
})
export class EncuestaComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  readonly pestana = signal<'responder' | 'resultados'>('responder');
  readonly catalogo = signal<DimensionCatalogo[]>([]);
  readonly evaluaciones = signal<FilaHistorial[]>([]);
  idEvaluacionSeleccionada: number | null = null;

  readonly respuestas = signal<Record<string, number>>({});
  readonly cargandoResumen = signal(false);
  readonly guardando = signal(false);
  readonly exito = signal(false);
  readonly error = signal<string | null>(null);
  readonly resumen = signal<ResumenEncuesta | null>(null);

  readonly opcionesLikert = OPCIONES_LIKERT;

  readonly totalPreguntas = computed(() => {
    return this.catalogo().reduce((acc, d) => acc + d.indicadores.length, 0);
  });

  readonly respondidasCount = computed(() => {
    return Object.keys(this.respuestas()).length;
  });

  readonly completa = computed(() => {
    return this.totalPreguntas() > 0 && this.respondidasCount() === this.totalPreguntas();
  });

  readonly promedioSesion = computed(() => {
    const vals = Object.values(this.respuestas());
    if (!vals.length) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  });

  ngOnInit() {
    this.cargarCatalogo();
    this.cargarEvaluaciones();

    this.route.queryParams.subscribe((params) => {
      if (params['id']) {
        this.idEvaluacionSeleccionada = Number(params['id']);
        this.cargarRespuestasExistentes();
      }
      if (params['tab'] === 'resultados') {
        this.abrirResultados();
      }
    });
  }

  cargarCatalogo() {
    this.api.obtenerCatalogoEncuesta().subscribe({
      next: (cat) => this.catalogo.set(cat),
      error: (err) => this.error.set(mensajeError(err)),
    });
  }

  cargarEvaluaciones() {
    this.api.historial().subscribe({
      next: (list) => {
        this.evaluaciones.set(list);
        if (!this.idEvaluacionSeleccionada && list.length > 0) {
          this.idEvaluacionSeleccionada = list[0].idEvaluacion;
          this.cargarRespuestasExistentes();
        }
      },
      error: () => {},
    });
  }

  cargarRespuestasExistentes() {
    if (!this.idEvaluacionSeleccionada) return;
    this.api.obtenerEncuestaPorEvaluacion(this.idEvaluacionSeleccionada).subscribe({
      next: (resp) => {
        const mapa: Record<string, number> = {};
        for (const r of resp) {
          mapa[`${r.dimension}___${r.indicador}`] = Number(r.puntaje);
        }
        this.respuestas.set(mapa);
      },
      error: () => {},
    });
  }

  getPuntaje(dimension: string, indicador: string): number | undefined {
    return this.respuestas()[`${dimension}___${indicador}`];
  }

  setPuntaje(dimension: string, indicador: string, valor: number) {
    this.respuestas.update((prev) => ({
      ...prev,
      [`${dimension}___${indicador}`]: valor,
    }));
  }

  getDescripcionDimension(dim: string): string {
    switch (dim) {
      case 'Adecuación funcional':
        return 'Evalúa si el software cumple las funciones para las cuales fue especificado y diseñado.';
      case 'Eficiencia de desempeño':
        return 'Evalúa el tiempo de respuesta, consumo de recursos de cómputo y capacidad.';
      case 'Capacidad de interacción':
        return 'Evalúa la usabilidad, facilidad de aprendizaje y operatividad por el personal.';
      case 'Seguridad':
        return 'Evalúa la confidencialidad (Ley 29733), integridad y autenticidad en el sistema.';
      default:
        return '';
    }
  }

  abrirResultados() {
    this.pestana.set('resultados');
    this.cargandoResumen.set(true);
    this.error.set(null);
    this.api.resumenEncuesta().subscribe({
      next: (r) => {
        this.resumen.set(r);
        this.cargandoResumen.set(false);
      },
      error: (err) => {
        this.error.set(mensajeError(err));
        this.cargandoResumen.set(false);
      },
    });
  }

  guardar() {
    if (!this.idEvaluacionSeleccionada || !this.completa()) return;
    this.guardando.set(true);
    this.error.set(null);
    this.exito.set(false);

    const items = Object.entries(this.respuestas()).map(([clave, puntaje]) => {
      const [dimension, indicador] = clave.split('___');
      return { dimension, indicador, puntaje };
    });

    this.api.guardarEncuesta(this.idEvaluacionSeleccionada, items).subscribe({
      next: () => {
        this.guardando.set(false);
        this.exito.set(true);
        setTimeout(() => this.exito.set(false), 5000);
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(mensajeError(err));
      },
    });
  }

  getNivelCalidadTexto(prom: number | null): string {
    if (prom === null || prom === undefined) return 'Sin datos';
    if (prom >= 4.5) return 'Excelente';
    if (prom >= 3.5) return 'Favorable';
    if (prom >= 2.5) return 'Regular';
    return 'Deficiente';
  }

  getInterpretacion(prom: number): string {
    if (prom >= 4.5) return 'Muy alto cumplimiento';
    if (prom >= 3.8) return 'Alto cumplimiento';
    if (prom >= 3.0) return 'Cumplimiento aceptable';
    return 'Oportunidad de mejora';
  }

  getBadgeClass(prom: number): string {
    if (prom >= 4.0) return 'Bajo'; // verde
    if (prom >= 3.0) return 'Moderado'; // naranja
    return 'Alto'; // rojo
  }

  exportarCsv() {
    const r = this.resumen();
    if (!r) return;
    const lineas = [
      'Dimension,Indicador,Promedio_Likert,Porcentaje_Logro,Total_Respuestas,Interpretacion',
      ...r.porIndicador.map(
        (i) =>
          `"${i.dimension}","${i.indicador}",${i.promedio},${((i.promedio / 5) * 100).toFixed(1)}%,${i.total},"${this.getInterpretacion(i.promedio)}"`,
      ),
    ];
    const blob = new Blob([lineas.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calidad_software_iso25010_tesis_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
