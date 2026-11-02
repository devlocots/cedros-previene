import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { ApiService } from './api.service';
import { Usuario } from './models';

const CLAVE_TOKEN = 'cp_token';
const CLAVE_USUARIO = 'cp_usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly usuario = signal<Usuario | null>(this.leerUsuario());

  readonly esAdmin = computed(() => this.usuario()?.rol === 'Admin');
  readonly esMedico = computed(() => this.usuario()?.rol === 'Médico');
  readonly esJefatura = computed(() => this.usuario()?.rol === 'Jefatura');
  readonly esTamizaje = computed(() => this.usuario()?.rol === 'Tamizaje');

  get token(): string | null {
    return localStorage.getItem(CLAVE_TOKEN);
  }

  estaAutenticado(): boolean {
    return !!this.token;
  }

  login(correo: string, password: string) {
    return this.api.login(correo, password).pipe(
      tap((r) => {
        localStorage.setItem(CLAVE_TOKEN, r.token);
        localStorage.setItem(CLAVE_USUARIO, JSON.stringify(r.usuario));
        this.usuario.set(r.usuario);
      }),
    );
  }

  logout() {
    this.api.logout().subscribe({
      next: () => {},
      error: () => {},
      complete: () => {
        localStorage.removeItem(CLAVE_TOKEN);
        localStorage.removeItem(CLAVE_USUARIO);
        this.usuario.set(null);
        this.router.navigate(['/login']);
      },
    });
  }

  private leerUsuario(): Usuario | null {
    try {
      return JSON.parse(localStorage.getItem(CLAVE_USUARIO) ?? 'null');
    } catch {
      return null;
    }
  }
}
