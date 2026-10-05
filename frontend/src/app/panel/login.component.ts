import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { mensajeError } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { IconComponent } from '../shared/icon.component';
import { LogoComponent } from '../shared/logo.component';
import { ThemeToggleComponent } from '../shared/theme-toggle.component';

/** HU10: inicio de sesión del personal de salud. */
@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, IconComponent, LogoComponent, ThemeToggleComponent],
  template: `
    <div class="auth">
      <aside class="auth-side">
        <div class="auth-side-bg" aria-hidden="true"></div>
        <a routerLink="/" class="brand-link on-dark"><app-logo /></a>
        <div class="auth-copy">
          <h2>Panel del personal de salud</h2>
          <p>Registra evaluaciones, revisa el historial y sigue el tamizaje de diabetes tipo 2 en Los Cedros de Villa.</p>
          <ul>
            <li><app-icon name="stethoscope" [size]="18" /> Evaluación con las 8 variables clínicas</li>
            <li><app-icon name="activity" [size]="18" /> Estimación con inteligencia artificial</li>
            <li><app-icon name="chart" [size]="18" /> Historial e indicadores del tamizaje</li>
            <li><app-icon name="lock" [size]="18" /> Acceso protegido y datos anónimos</li>
          </ul>
        </div>
        <span class="auth-foot">Cedros Previene · 2026</span>
      </aside>

      <main class="auth-main">
        <div class="auth-tools">
          <a routerLink="/" class="link-btn"><app-icon name="arrow-left" [size]="16" /> Ir al sitio público</a>
          <app-theme-toggle />
        </div>

        <form class="auth-form rise" (ngSubmit)="ingresar()" novalidate>
          <div>
            <span class="eyebrow">Acceso restringido</span>
            <h1>Inicia sesión</h1>
            <p class="muted">Usa la cuenta que te asignó el administrador.</p>
          </div>

          <label class="field">
            <span class="flabel">Correo</span>
            <span class="inp with-ico">
              <app-icon name="mail" [size]="18" />
              <input id="correo" name="correo" type="email" autocomplete="username" [(ngModel)]="correo" placeholder="nombre&#64;cedrosprevine.pe" required />
            </span>
          </label>

          <label class="field">
            <span class="flabel">Contraseña</span>
            <span class="inp with-ico">
              <app-icon name="lock" [size]="18" />
              <input id="password" name="password" [type]="ver() ? 'text' : 'password'" autocomplete="current-password" [(ngModel)]="password" required />
              <button type="button" class="inp-btn" (click)="ver.set(!ver())" [attr.aria-label]="ver() ? 'Ocultar contraseña' : 'Mostrar contraseña'">
                <app-icon [name]="ver() ? 'eye-off' : 'eye'" [size]="18" />
              </button>
            </span>
          </label>

          @if (error()) {
            <div class="alert" role="alert"><app-icon name="alert" [size]="18" /> {{ error() }}</div>
          }

          <button class="btn lg block" type="submit" [disabled]="cargando()">
            @if (cargando()) {
              <span class="spin"></span> Ingresando…
            } @else {
              Ingresar <app-icon name="arrow-right" [size]="18" />
            }
          </button>

          <div class="demo-box">
            <div>
              <b>Cuenta de demostración</b>
              <span class="muted mono">tamizaje1&#64;cedrosprevine.pe · Cedros2026!</span>
            </div>
            <button type="button" class="btn ghost small" (click)="usarDemo()">Usar</button>
          </div>
        </form>
      </main>
    </div>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  correo = '';
  password = '';
  readonly ver = signal(false);
  readonly error = signal('');
  readonly cargando = signal(false);

  usarDemo() {
    this.correo = 'tamizaje1@cedrosprevine.pe';
    this.password = 'Cedros2026!';
    this.error.set('');
  }

  ingresar() {
    if (!this.correo.includes('@') || this.password.length < 6) {
      this.error.set('Ingrese su correo y una contraseña de al menos 6 caracteres.');
      return;
    }
    this.error.set('');
    this.cargando.set(true);
    this.auth.login(this.correo, this.password).subscribe({
      next: () => this.router.navigate(['/panel']),
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }
}
