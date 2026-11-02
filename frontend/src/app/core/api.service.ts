import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import {
  DimensionCatalogo,
  EntradaBitacora,
  FilaHistorial,
  ReporteClinico,
  RespuestaItem,
  ResultadoEvaluacion,
  Resumen,
  ResumenEncuesta,
  Rol,
  Usuario,
  UsuarioAdmin,
} from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.apiUrl;

  login(correo: string, password: string) {
    return this.http.post<{ token: string; usuario: Usuario }>(`${this.url}/auth/login`, { correo, password });
  }

  logout() {
    return this.http.post<{ ok: boolean }>(`${this.url}/auth/logout`, {});
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

  obtenerCatalogoEncuesta() {
    return this.http.get<DimensionCatalogo[]>(`${this.url}/encuesta/catalogo`);
  }

  guardarEncuesta(idEvaluacion: number, respuestas: RespuestaItem[]) {
    return this.http.post<{ guardado: boolean; idEvaluacion: number; totalRespuestas: number }>(
      `${this.url}/encuesta`,
      { idEvaluacion, respuestas },
    );
  }

  resumenEncuesta() {
    return this.http.get<ResumenEncuesta>(`${this.url}/encuesta/resumen`);
  }

  obtenerEncuestaPorEvaluacion(idEvaluacion: number) {
    return this.http.get<any[]>(`${this.url}/encuesta/evaluacion/${idEvaluacion}`);
  }

  // Reportes clínicos (HU11 auditoría de descarga)
  obtenerReporteClinico(idEvaluacion: number) {
    return this.http.get<ReporteClinico>(`${this.url}/reportes/evaluacion/${idEvaluacion}`);
  }

  // Administración de usuarios y auditoría (Rol Admin)
  listarRolesAdmin() {
    return this.http.get<Rol[]>(`${this.url}/admin/roles`);
  }

  listarUsuariosAdmin() {
    return this.http.get<UsuarioAdmin[]>(`${this.url}/admin/usuarios`);
  }

  crearUsuarioAdmin(datos: { nombres: string; correo: string; password: string; idRol: number }) {
    return this.http.post<{ creado: boolean; idUsuario: number }>(`${this.url}/admin/usuarios`, datos);
  }

  toggleActivoUsuario(idUsuario: number, activo: boolean) {
    return this.http.patch<{ idUsuario: number; activo: boolean }>(`${this.url}/admin/usuarios/${idUsuario}/activo`, {
      activo,
    });
  }

  listarBitacoraAdmin(limite = 50) {
    const params = new HttpParams().set('limite', limite);
    return this.http.get<EntradaBitacora[]>(`${this.url}/admin/bitacora`, { params });
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
