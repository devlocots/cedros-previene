import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { IconComponent } from '../shared/icon.component';
import { LogoComponent } from '../shared/logo.component';
import { ThemeToggleComponent } from '../shared/theme-toggle.component';

/** Estructura del panel del personal: menú lateral, barra superior y contenido. */
@Component({
  selector: 'app-panel',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, DatePipe, IconComponent, LogoComponent, ThemeToggleComponent],
  template: `
    <div class="app">
      <aside class="side no-print">
        <a routerLink="/panel" class="brand-link side-brand"><app-logo /></a>
        <nav class="side-nav">
          <span class="side-label">Principal</span>
          <a routerLink="inicio" routerLinkActive="active"><app-icon name="home" [size]="18" /> Inicio</a>
          <a routerLink="nueva" routerLinkActive="active"><app-icon name="plus" [size]="18" /> Nueva evaluación</a>
          <a routerLink="historial" routerLinkActive="active"><app-icon name="list" [size]="18" /> Historial</a>
          <span class="side-label">Próximamente</span>
          <span class="disabled"><app-icon name="layers" [size]="18" /> Evaluación por lote <em>S3</em></span>
          <span class="disabled"><app-icon name="file" [size]="18" /> Reportes PDF <em>S2</em></span>
        </nav>
        <div class="side-user">
          <span class="avatar">{{ iniciales() }}</span>
          <div class="side-user-txt">
            <b>{{ auth.usuario()?.nombres }}</b>
            <span class="muted">{{ auth.usuario()?.rol }}</span>
          </div>
          <button type="button" class="icon-btn" (click)="auth.logout()" title="Cerrar sesión" aria-label="Cerrar sesión">
            <app-icon name="logout" [size]="18" />
          </button>
        </div>
      </aside>

      <div class="app-main">
        <header class="topbar no-print">
          <div>
            <span class="muted small">{{ hoy | date: "EEEE d 'de' MMMM, y" }}</span>
            <b class="topbar-hi">Hola, {{ auth.usuario()?.nombres }}</b>
          </div>
          <div class="topbar-r">
            <a routerLink="/test" target="_blank" class="btn ghost small"><app-icon name="external" [size]="16" /> Test público</a>
            <app-theme-toggle />
          </div>
        </header>
        <main class="content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class PanelComponent {
  readonly auth = inject(AuthService);
  readonly hoy = new Date();

  iniciales(): string {
    const n = this.auth.usuario()?.nombres ?? '';
    const partes = n.split(' ').filter((p) => p && /[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(p[0]));
    return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase() || 'CP';
  }
}
