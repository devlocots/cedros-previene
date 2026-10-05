import { DecimalPipe } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, signal } from '@angular/core';

const R = 52;
const C = 2 * Math.PI * R;

/** Anillo animado con la probabilidad estimada y marcas de los umbrales. */
@Component({
  selector: 'app-gauge',
  imports: [DecimalPipe],
  template: `
    <div [class]="'gauge ' + nivel" [style.width.px]="size" [style.height.px]="size">
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle class="g-track" cx="60" cy="60" r="52" />
        <circle class="g-arc" cx="60" cy="60" r="52" transform="rotate(-90 60 60)"
                [attr.stroke-dasharray]="circ" [attr.stroke-dashoffset]="offset" />
        <circle class="g-mark" [attr.cx]="marca(umbralModerado).x" [attr.cy]="marca(umbralModerado).y" r="2.4" />
        <circle class="g-mark" [attr.cx]="marca(umbralAlto).x" [attr.cy]="marca(umbralAlto).y" r="2.4" />
      </svg>
      <div class="g-center">
        <span class="g-num">{{ mostrado() | number: '1.1-1' }}<small>%</small></span>
        @if (caption) {
          <span class="g-cap">{{ caption }}</span>
        }
      </div>
    </div>
  `,
})
export class GaugeComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) valor = 0;
  @Input() nivel = 'Bajo';
  @Input() size = 200;
  @Input() caption = '';
  @Input() umbralModerado = 0.15;
  @Input() umbralAlto = 0.5;

  readonly circ = C;
  readonly mostrado = signal(0);
  private raf = 0;

  get offset(): number {
    return C * (1 - Math.min(1, Math.max(0, this.valor)));
  }

  marca(u: number) {
    const a = -Math.PI / 2 + u * 2 * Math.PI;
    return { x: 60 + R * Math.cos(a), y: 60 + R * Math.sin(a) };
  }

  ngOnChanges() {
    cancelAnimationFrame(this.raf);
    const destino = this.valor * 100;
    const inicio = performance.now();
    const duracion = 1200;
    const paso = (t: number) => {
      const k = Math.min(1, (t - inicio) / duracion);
      const e = 1 - Math.pow(1 - k, 3);
      this.mostrado.set(destino * e);
      if (k < 1) this.raf = requestAnimationFrame(paso);
    };
    this.raf = requestAnimationFrame(paso);
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.raf);
  }
}
