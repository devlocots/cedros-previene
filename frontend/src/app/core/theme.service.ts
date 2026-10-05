import { effect, Injectable, signal } from '@angular/core';

type Tema = 'light' | 'dark';

/** Tema claro / oscuro, recordado en el navegador. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly tema = signal<Tema>(this.inicial());

  constructor() {
    effect(() => {
      const t = this.tema();
      document.documentElement.setAttribute('data-theme', t);
      try {
        localStorage.setItem('cp_tema', t);
      } catch {
        /* sin almacenamiento */
      }
    });
  }

  alternar() {
    this.tema.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  private inicial(): Tema {
    try {
      const t = localStorage.getItem('cp_tema');
      if (t === 'light' || t === 'dark') return t;
    } catch {
      /* sin almacenamiento */
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
