import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Factor, ResultadoEvaluacion } from '../core/models';
import { GaugeComponent } from './gauge.component';
import { IconComponent } from './icon.component';

const NOMBRE_IMPUTADO: Record<string, string> = {
  glucosa: 'glucosa',
  presion: 'presión diastólica',
  pliegue: 'pliegue cutáneo',
  insulina: 'insulina',
};

interface Recomendacion {
  icono: string;
  titulo: string;
  texto: string;
}

const PUBLICO: Record<string, Recomendacion[]> = {
  Bajo: [
    { icono: 'food', titulo: 'Sigue comiendo bien', texto: 'Verduras y frutas todos los días, y menos bebidas azucaradas.' },
    { icono: 'run', titulo: 'Muévete', texto: 'Al menos 150 minutos de actividad física por semana.' },
    { icono: 'calendar', titulo: 'Repite el test', texto: 'Vuelve a medir tu riesgo dentro de un año.' },
  ],
  Moderado: [
    { icono: 'droplet', titulo: 'Hazte una prueba', texto: 'Pide una glucosa en ayunas en tu establecimiento de salud en los próximos 3 meses.' },
    { icono: 'scale', titulo: 'Cuida tu peso', texto: 'Si tu IMC es alto, bajar entre 5 % y 7 % de tu peso reduce el riesgo.' },
    { icono: 'run', titulo: 'Muévete', texto: 'Al menos 150 minutos de actividad física por semana.' },
  ],
  Alto: [
    { icono: 'stethoscope', titulo: 'Acude pronto a consulta', texto: 'Pide una prueba de glucosa o de hemoglobina glicosilada (HbA1c).' },
    { icono: 'file', titulo: 'Lleva este resultado', texto: 'Muéstralo al profesional de salud que te atienda.' },
    { icono: 'heart', titulo: 'Empieza hoy', texto: 'Cambios en alimentación y actividad física desde ahora.' },
  ],
};

const PERSONAL: Record<string, Recomendacion[]> = {
  Bajo: [
    { icono: 'check', titulo: 'Sin derivación', texto: 'Reforzar hábitos saludables y repetir el tamizaje en 12 meses.' },
    { icono: 'run', titulo: 'Consejería', texto: 'Actividad física 150 min/semana y alimentación saludable.' },
  ],
  Moderado: [
    { icono: 'droplet', titulo: 'Solicitar glucosa en ayunas', texto: 'Dentro de los próximos 3 meses.' },
    { icono: 'scale', titulo: 'Consejería nutricional', texto: 'Meta de reducción de peso de 5 % a 7 % si el IMC es alto.' },
  ],
  Alto: [
    { icono: 'stethoscope', titulo: 'Derivar a medicina', texto: 'Solicitar glucosa en ayunas o HbA1c para confirmar o descartar.' },
    { icono: 'calendar', titulo: 'Seguimiento cercano', texto: 'Programar control y registrar el resultado de laboratorio.' },
  ],
};

const FRASE: Record<string, string> = {
  Bajo: 'Tu riesgo estimado es bajo.',
  Moderado: 'Tu riesgo estimado es moderado.',
  Alto: 'Tu riesgo estimado es alto.',
};

/** Resultado de la estimación: anillo animado, factores, recomendaciones (HU04). */
@Component({
  selector: 'app-resultado',
  imports: [DatePipe, DecimalPipe, GaugeComponent, IconComponent],
  template: `
    <article class="resultado" [class.compacto]="modoPersonal">
      <section [class]="'res-hero tone-' + r.nivel">
        <app-gauge [valor]="r.probabilidad" [nivel]="r.nivel" [size]="modoPersonal ? 170 : 210"
                   [umbralModerado]="r.umbrales.moderado" [umbralAlto]="r.umbrales.alto" caption="probabilidad" />
        <div class="res-hero-txt">
          <span class="eyebrow">{{ r.codigo }} · {{ r.fechaHora | date: 'dd/MM/yyyy HH:mm' }}</span>
          <span [class]="'level big ' + r.nivel">Riesgo {{ r.nivel.toLowerCase() }}</span>
          <h2>{{ modoPersonal ? 'Riesgo estimado: ' + r.nivel.toLowerCase() : frase }}</h2>
          <p class="muted">
            Según el modelo, de cada 100 personas con un perfil como {{ modoPersonal ? 'este' : 'el tuyo' }},
            unas <b>{{ r.probabilidad * 100 | number: '1.0-0' }}</b> podrían desarrollar diabetes tipo 2.
          </p>
          <div class="escala" aria-hidden="true">
            <span class="esc-seg Bajo" [style.flex-grow]="r.umbrales.moderado">Bajo</span>
            <span class="esc-seg Moderado" [style.flex-grow]="r.umbrales.alto - r.umbrales.moderado">Moderado</span>
            <span class="esc-seg Alto" [style.flex-grow]="1 - r.umbrales.alto">Alto</span>
            <i class="esc-pin" [style.left.%]="pin"></i>
          </div>
        </div>
      </section>

      <section class="res-card">
        <div class="res-card-head">
          <app-icon name="chart" [size]="18" />
          <h3>{{ modoPersonal ? 'Factores que más influyeron' : 'Lo que más influyó en tu resultado' }}</h3>
        </div>
        <div class="div-bars">
          @for (f of factores; track f.variable) {
            <div class="div-row">
              <span class="div-name">{{ f.nombre }} <small class="muted mono">{{ f.valor | number: '1.0-2' }}</small></span>
              <span class="div-track neg"><i [style.width.%]="f.contribucion < 0 ? ancho(f) : 0"></i></span>
              <span class="div-track pos"><i [style.width.%]="f.contribucion > 0 ? ancho(f) : 0"></i></span>
              <span [class]="'div-val ' + (f.contribucion >= 0 ? 't-high' : 't-low')">{{ f.contribucion >= 0 ? '+' : '−' }}{{ abs(f.contribucion) * 100 | number: '1.1-1' }} pp</span>
            </div>
          } @empty {
            <p class="muted">No hay factores para mostrar.</p>
          }
        </div>
        <div class="div-legend">
          <span><i class="dot low"></i>Reduce el riesgo</span>
          <span><i class="dot high"></i>Aumenta el riesgo</span>
          <span class="muted">pp = puntos porcentuales frente a un valor típico</span>
        </div>
        @if (imputados.length) {
          <p class="nota-imp"><app-icon name="info" [size]="16" /> Se completó con el valor típico: {{ imputados.join(', ') }}. Con estos datos el resultado sería más preciso.</p>
        }
      </section>

      <section class="res-card">
        <div class="res-card-head">
          <app-icon name="sparkles" [size]="18" />
          <h3>{{ modoPersonal ? 'Conducta sugerida' : 'Qué te recomendamos' }}</h3>
        </div>
        <div class="reco-grid">
          @for (c of recomendaciones; track c.titulo) {
            <div [class]="'reco tone-' + r.nivel">
              <span class="reco-ico"><app-icon [name]="c.icono" [size]="20" /></span>
              <b>{{ c.titulo }}</b>
              <span class="muted">{{ c.texto }}</span>
            </div>
          }
        </div>
      </section>

      <footer class="res-foot">
        <p class="disclaimer">
          <app-icon name="shield" [size]="16" />
          Esta es una estimación del riesgo, no un diagnóstico. Solo un profesional de salud puede diagnosticar la diabetes con análisis de laboratorio.
          Modelo {{ r.modelo }} · respuesta en {{ r.tiempoMs }} ms.
        </p>
        <div class="res-actions no-print">
          <button type="button" class="btn ghost" (click)="imprimir()"><app-icon name="print" [size]="18" /> Imprimir o guardar PDF</button>
          @if (!modoPersonal) {
            <button type="button" class="btn" (click)="otro.emit()"><app-icon name="refresh" [size]="18" /> Hacer otro test</button>
          }
        </div>
      </footer>
    </article>
  `,
})
export class ResultadoComponent {
  @Input({ required: true }) r!: ResultadoEvaluacion;
  @Input() modoPersonal = false;
  @Output() otro = new EventEmitter<void>();

  get frase(): string {
    return FRASE[this.r.nivel] ?? '';
  }

  get pin(): number {
    return Math.min(99, Math.max(1, this.r.probabilidad * 100));
  }

  get factores(): Factor[] {
    return this.r.factores.filter((f) => !f.imputado && Math.abs(f.contribucion) > 0.0004).slice(0, 6);
  }

  get imputados(): string[] {
    return this.r.imputados.map((k) => NOMBRE_IMPUTADO[k] ?? k);
  }

  get recomendaciones(): Recomendacion[] {
    return (this.modoPersonal ? PERSONAL : PUBLICO)[this.r.nivel] ?? [];
  }

  abs(v: number): number {
    return Math.abs(v);
  }

  ancho(f: Factor): number {
    const max = Math.max(...this.factores.map((x) => Math.abs(x.contribucion)), 0.0001);
    return (Math.abs(f.contribucion) / max) * 100;
  }

  imprimir() {
    window.print();
  }
}
