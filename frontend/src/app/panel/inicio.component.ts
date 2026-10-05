import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { FilaHistorial, Nivel } from '../core/models';
import { IconComponent } from '../shared/icon.component';

interface Dia {
  etiqueta: string;
  total: number;
}

const R = 46;
const C = 2 * Math.PI * R;

/** Inicio del panel: indicadores del tamizaje con datos reales de MySQL. */
@Component({
  selector: 'app-inicio',
  imports: [RouterLink, DecimalPipe, DatePipe, IconComponent],
  template: `
    <div class="page-head">
      <div>
        <span class="eyebrow">Resumen del tamizaje</span>
        <h1>Inicio</h1>
      </div>
      <a routerLink="../nueva" class="btn"><app-icon name="plus" [size]="18" /> Nueva evaluación</a>
    </div>

    <div class="kpis">
      <div class="kpi">
        <span class="kpi-ico"><app-icon name="activity" /></span>
        <span class="kpi-lbl">Evaluaciones</span>
        <b class="kpi-num">{{ total() }}</b>
        <span class="muted small">{{ hoyCount() }} hoy</span>
      </div>
      <div class="kpi tone-Bajo">
        <span class="kpi-ico"><app-icon name="check" /></span>
        <span class="kpi-lbl">Riesgo bajo</span>
        <b class="kpi-num">{{ cuenta('Bajo') }}</b>
        <span class="muted small">{{ pct('Bajo') | number: '1.0-0' }} % del total</span>
      </div>
      <div class="kpi tone-Moderado">
        <span class="kpi-ico"><app-icon name="info" /></span>
        <span class="kpi-lbl">Riesgo moderado</span>
        <b class="kpi-num">{{ cuenta('Moderado') }}</b>
        <span class="muted small">{{ pct('Moderado') | number: '1.0-0' }} % del total</span>
      </div>
      <div class="kpi tone-Alto">
        <span class="kpi-ico"><app-icon name="alert" /></span>
        <span class="kpi-lbl">Riesgo alto</span>
        <b class="kpi-num">{{ cuenta('Alto') }}</b>
        <span class="muted small">{{ pct('Alto') | number: '1.0-0' }} % del total</span>
      </div>
    </div>

    <div class="dash-grid">
      <section class="card">
        <div class="card-head"><h3>Distribución por nivel</h3></div>
        <div class="donut-wrap">
          <svg viewBox="0 0 120 120" class="donut" aria-hidden="true">
            <circle cx="60" cy="60" r="46" class="d-track" />
            <circle cx="60" cy="60" r="46" class="d-seg low" transform="rotate(-90 60 60)"
                    [attr.stroke-dasharray]="seg('Bajo') + ' ' + circ" [attr.stroke-dashoffset]="0" />
            <circle cx="60" cy="60" r="46" class="d-seg mid" transform="rotate(-90 60 60)"
                    [attr.stroke-dasharray]="seg('Moderado') + ' ' + circ" [attr.stroke-dashoffset]="-seg('Bajo')" />
            <circle cx="60" cy="60" r="46" class="d-seg high" transform="rotate(-90 60 60)"
                    [attr.stroke-dasharray]="seg('Alto') + ' ' + circ" [attr.stroke-dashoffset]="-(seg('Bajo') + seg('Moderado'))" />
          </svg>
          <div class="donut-center"><b>{{ total() }}</b><span class="muted small">evaluaciones</span></div>
        </div>
        <ul class="legend">
          <li><i class="dot low"></i> Bajo <b>{{ cuenta('Bajo') }}</b></li>
          <li><i class="dot mid"></i> Moderado <b>{{ cuenta('Moderado') }}</b></li>
          <li><i class="dot high"></i> Alto <b>{{ cuenta('Alto') }}</b></li>
        </ul>
      </section>

      <section class="card">
        <div class="card-head"><h3>Evaluaciones de los últimos 7 días</h3></div>
        <div class="vbars">
          @for (d of dias(); track d.etiqueta) {
            <div class="vbar">
              <span class="vbar-n">{{ d.total }}</span>
              <span class="vbar-col"><i [style.height.%]="altura(d.total)"></i></span>
              <span class="vbar-l">{{ d.etiqueta }}</span>
            </div>
          }
        </div>
      </section>

      <section class="card">
        <div class="card-head"><h3>Canal de evaluación</h3></div>
        <div class="split-bars">
          <div class="sb-row">
            <span><app-icon name="user" [size]="16" /> Autoevaluación web</span><b>{{ canal('Autoevaluación web') }}</b>
          </div>
          <span class="sb-track"><i [style.width.%]="pctCanal('Autoevaluación web')"></i></span>
          <div class="sb-row">
            <span><app-icon name="stethoscope" [size]="16" /> Tamizaje asistido</span><b>{{ canal('Tamizaje asistido') }}</b>
          </div>
          <span class="sb-track alt"><i [style.width.%]="pctCanal('Tamizaje asistido')"></i></span>
        </div>
        <div class="mini-stat">
          <span class="muted small">Probabilidad promedio</span>
          <b>{{ promedio() * 100 | number: '1.1-1' }} %</b>
        </div>
      </section>
    </div>

    <section class="card">
      <div class="card-head">
        <h3>Últimas evaluaciones</h3>
        <a routerLink="../historial" class="link-btn">Ver historial <app-icon name="arrow-right" [size]="16" /></a>
      </div>
      <div class="tablewrap flat">
        <table>
          <thead><tr><th>Código</th><th>Fecha</th><th>Canal</th><th>Probabilidad</th><th>Nivel</th></tr></thead>
          <tbody>
            @for (f of recientes(); track f.idEvaluacion) {
              <tr>
                <td class="num">{{ f.codigo }}</td>
                <td class="num">{{ f.fechaHora | date: 'dd/MM HH:mm' }}</td>
                <td>{{ f.canal }}</td>
                <td class="num">{{ f.probabilidad * 100 | number: '1.1-1' }} %</td>
                <td><span [class]="'level small ' + f.nivel">{{ f.nivel }}</span></td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="empty">{{ cargando() ? 'Cargando…' : 'Todavía no hay evaluaciones. Registra la primera.' }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class InicioComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly circ = C;
  readonly filas = signal<FilaHistorial[]>([]);
  readonly cargando = signal(true);

  ngOnInit() {
    this.api.historial('Todos').subscribe({
      next: (f) => {
        this.filas.set(f);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  total(): number {
    return this.filas().length;
  }

  cuenta(n: Nivel): number {
    return this.filas().filter((f) => f.nivel === n).length;
  }

  pct(n: Nivel): number {
    return this.total() ? (this.cuenta(n) / this.total()) * 100 : 0;
  }

  seg(n: Nivel): number {
    return this.total() ? (this.cuenta(n) / this.total()) * C : 0;
  }

  canal(c: string): number {
    return this.filas().filter((f) => f.canal === c).length;
  }

  pctCanal(c: string): number {
    return this.total() ? (this.canal(c) / this.total()) * 100 : 0;
  }

  promedio(): number {
    const f = this.filas();
    return f.length ? f.reduce((a, x) => a + Number(x.probabilidad), 0) / f.length : 0;
  }

  hoyCount(): number {
    const hoy = new Date().toDateString();
    return this.filas().filter((f) => new Date(f.fechaHora).toDateString() === hoy).length;
  }

  recientes(): FilaHistorial[] {
    return this.filas().slice(0, 6);
  }

  dias(): Dia[] {
    const nombres = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
    const lista: Dia[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const clave = d.toDateString();
      lista.push({
        etiqueta: i === 0 ? 'hoy' : nombres[d.getDay()] + ' ' + d.getDate(),
        total: this.filas().filter((f) => new Date(f.fechaHora).toDateString() === clave).length,
      });
    }
    return lista;
  }

  altura(n: number): number {
    const max = Math.max(...this.dias().map((d) => d.total), 1);
    return Math.max(4, (n / max) * 100);
  }
}
