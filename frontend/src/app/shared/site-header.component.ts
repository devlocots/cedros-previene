import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from './icon.component';
import { LogoComponent } from './logo.component';
import { ThemeToggleComponent } from './theme-toggle.component';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, LogoComponent, ThemeToggleComponent, IconComponent],
  template: `
    <header class="site-header no-print">
      <div class="wrap site-header-in">
        <a routerLink="/" class="brand-link" aria-label="Inicio"><app-logo /></a>
        <nav class="site-nav">
          <a routerLink="/" fragment="como-funciona" class="hide-sm">Cómo funciona</a>
          <a routerLink="/" fragment="factores" class="hide-sm">Factores de riesgo</a>
          <a routerLink="/login" class="nav-staff"><app-icon name="stethoscope" [size]="16" /> <span class="hide-sm">Personal de salud</span></a>
          <app-theme-toggle />
          <a routerLink="/test" class="btn small">Hacer el test</a>
        </nav>
      </div>
    </header>
  `,
})
export class SiteHeaderComponent {}
