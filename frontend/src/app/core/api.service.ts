import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { FilaHistorial, ResultadoEvaluacion, Resumen, Usuario } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.apiUrl;

  login(correo: string, password: string) {
    return this.http.post<{ token: string; usuario: Usuario }>(`${this.url}/auth/login`, { correo, password });
  }

  evaluarPublica(datos: Record<string, unknown>) {
    return this.http.post<ResultadoEvaluacion>(`${this.url}/evaluaciones/publica`, datos);
  }

  evaluarPersonal(datos: Record<string, unknown>) {
    return this.http.post<ResultadoEvaluacion>(`${this.url}/evaluaciones`, datos);
  }

  historial(nivel?: string) {
    let params = new HttpParams().set('limite', 200);
    if (nivel && nivel !== 'Todos') params = params.set('nivel', nivel);
    return this.http.get<FilaHistorial[]>(`${this.url}/evaluaciones`, { params });
  }

  resumen() {
    return this.http.get<Resumen>(`${this.url}/evaluaciones/resumen`);
  }
}

/** Convierte un error HTTP en un mensaje claro para el usuario. */
export function mensajeError(err: HttpErrorResponse): string {
  if (err.status === 0) {
    return 'No se pudo conectar con el servidor. Verifique que el backend esté encendido.';
  }
  const m = err.error?.message;
  if (Array.isArray(m)) return m.join(' ');
  if (typeof m === 'string') return m;
  return 'Ocurrió un error inesperado. Inténtelo de nuevo.';
}
