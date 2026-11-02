import { DatePipe, NgClass } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, mensajeError } from '../core/api.service';
import { EntradaBitacora, Rol, UsuarioAdmin } from '../core/models';
import { IconComponent } from '../shared/icon.component';

@Component({
  selector: 'app-admin-usuarios',
  imports: [FormsModule, DatePipe, NgClass, IconComponent],
  template: `
    <div class="page-head">
      <div>
        <span class="eyebrow">Administración del Sistema · Rol Admin</span>
        <h1>Gestión de Usuarios y Seguridad</h1>
        <p class="muted">Control de credenciales del personal de salud y bitácora de auditoría de accesos (HU11).</p>
      </div>
      <div class="page-head-r">
        <div class="seg">
          <button type="button" [attr.aria-pressed]="tab() === 'usuarios'" (click)="tab.set('usuarios')">
            <app-icon name="users" [size]="16" /> Personal ({{ usuarios().length }})
          </button>
          <button type="button" [attr.aria-pressed]="tab() === 'bitacora'" (click)="cargarBitacora()">
            <app-icon name="list" [size]="16" /> Bitácora de accesos
          </button>
        </div>
      </div>
    </div>

    @if (error()) {
      <div class="alert" role="alert">
        <app-icon name="alert" [size]="18" /> {{ error() }}
      </div>
    }

    @if (exito()) {
      <div class="alert alert-success" role="status">
        <app-icon name="check" [size]="18" /> {{ exito() }}
      </div>
    }

    <!-- TAB 1: GESTIÓN DE USUARIOS -->
    @if (tab() === 'usuarios') {
      <div class="admin-grid">
        <div class="kpis">
          <div class="kpi">
            <span class="kpi-ico"><app-icon name="users" /></span>
            <span class="kpi-lbl">Total Personal</span>
            <b class="kpi-num">{{ usuarios().length }}</b>
            <span class="muted small">cuentas registradas</span>
          </div>
          <div class="kpi tone-Bajo">
            <span class="kpi-ico"><app-icon name="check" /></span>
            <span class="kpi-lbl">Activos</span>
            <b class="kpi-num">{{ activosCount() }}</b>
            <span class="muted small">con acceso habilitado</span>
          </div>
          <div class="kpi tone-Alto">
            <span class="kpi-ico"><app-icon name="lock" /></span>
            <span class="kpi-lbl">Inactivos / Bloqueados</span>
            <b class="kpi-num">{{ inactivosCount() }}</b>
            <span class="muted small">sin acceso al panel</span>
          </div>
        </div>

        <section class="card">
          <div class="card-head">
            <h3>Lista del Personal de Salud</h3>
            <button type="button" class="btn small" (click)="mostrarModal = true">
              <app-icon name="plus" [size]="16" /> Nuevo usuario
            </button>
          </div>

          <div class="tablewrap flat">
            <table class="table">
              <thead>
                <tr>
                  <th>Personal</th>
                  <th>Correo</th>
                  <th>Rol Asignado</th>
                  <th>Último Acceso</th>
                  <th>Estado</th>
                  <th class="tr">Acción</th>
                </tr>
              </thead>
              <tbody>
                @for (u of usuarios(); track u.idUsuario) {
                  <tr>
                    <td>
                      <b>{{ u.nombres }}</b>
                    </td>
                    <td class="mono small">{{ u.correo }}</td>
                    <td>
                      <span class="rol-badge" [ngClass]="getRolClass(u.rol)">{{ u.rol }}</span>
                    </td>
                    <td class="small muted">
                      {{ u.ultimoAcceso ? (u.ultimoAcceso | date: 'dd/MM/yyyy HH:mm') : 'Nunca ha ingresado' }}
                    </td>
                    <td>
                      <span class="level small" [class.Bajo]="u.activo" [class.Alto]="!u.activo">
                        {{ u.activo ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td class="tr">
                      <button
                        type="button"
                        class="btn ghost small"
                        (click)="toggleActivo(u)"
                        [title]="u.activo ? 'Desactivar acceso' : 'Habilitar acceso'"
                      >
                        {{ u.activo ? 'Desactivar' : 'Activar' }}
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="muted" style="text-align: center; padding: 20px;">
                      No se encontraron usuarios registrados.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <!-- MODAL NUEVO USUARIO -->
      @if (mostrarModal) {
        <div class="modal-backdrop">
          <div class="card modal-card">
            <div class="card-head">
              <h3><app-icon name="plus" [size]="18" /> Registrar nuevo personal</h3>
              <button type="button" class="icon-btn" (click)="cerrarModal()">
                <app-icon name="x" [size]="18" />
              </button>
            </div>

            <form (ngSubmit)="crearUsuario()" novalidate>
              <div class="modal-body">
                <label class="field">
                  <span class="flabel">Nombres completos</span>
                  <input type="text" class="inp" [(ngModel)]="nuevo.nombres" name="nombres" required placeholder="Ej. Dr. Carlos Mendoza" />
                </label>

                <label class="field">
                  <span class="flabel">Correo electrónico</span>
                  <input type="email" class="inp" [(ngModel)]="nuevo.correo" name="correo" required placeholder="carlos@cedrosprevine.pe" />
                </label>

                <label class="field">
                  <span class="flabel">Contraseña inicial</span>
                  <input type="password" class="inp" [(ngModel)]="nuevo.password" name="password" required minlength="6" placeholder="Mínimo 6 caracteres" />
                </label>

                <label class="field">
                  <span class="flabel">Rol y permisos</span>
                  <select class="select" [(ngModel)]="nuevo.idRol" name="idRol" required>
                    @for (r of roles(); track r.idRol) {
                      <option [ngValue]="r.idRol">{{ r.nombre }} — {{ r.descripcion }}</option>
                    }
                  </select>
                </label>
              </div>

              <div class="modal-foot">
                <button type="button" class="btn ghost" (click)="cerrarModal()">Cancelar</button>
                <button type="submit" class="btn" [disabled]="guardando()">
                  @if (guardando()) {
                    <span class="spin"></span> Guardando…
                  } @else {
                    Crear usuario
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    }

    <!-- TAB 2: BITÁCORA DE AUDITORÍA -->
    @if (tab() === 'bitacora') {
      <section class="card">
        <div class="card-head">
          <div>
            <h3>Bitácora de Auditoría de Accesos (HU11)</h3>
            <p class="muted small">Registro inmutable de inicios de sesión, cierres de sesión, evaluaciones y descargas.</p>
          </div>
          <button type="button" class="btn ghost small" (click)="cargarBitacora()">
            <app-icon name="refresh" [size]="16" /> Actualizar
          </button>
        </div>

        <div class="tablewrap flat">
          <table class="table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Acción Realizada</th>
                <th>Dirección IP</th>
              </tr>
            </thead>
            <tbody>
              @for (b of bitacora(); track b.idBitacora) {
                <tr>
                  <td class="mono small">{{ b.fechaHora | date: 'dd/MM/yyyy HH:mm:ss' }}</td>
                  <td><b>{{ b.usuario }}</b></td>
                  <td><span class="rol-badge" [ngClass]="getRolClass(b.rol)">{{ b.rol }}</span></td>
                  <td>
                    <span class="accion-tag" [ngClass]="getAccionClass(b.accion)">{{ b.accion }}</span>
                  </td>
                  <td class="mono small muted">{{ b.ip || '127.0.0.1' }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="muted" style="text-align: center; padding: 20px;">
                    No hay registros en la bitácora todavía.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    }
  `,
  styles: [
    `
      .admin-grid { display: flex; flex-direction: column; gap: 20px; }
      .rol-badge {
        font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 99px;
        background: var(--sunken); color: var(--muted);
      }
      .rol-admin { background: #fce8e6; color: #c5221f; }
      .rol-medico { background: #e8f0fe; color: #1a73e8; }
      .rol-jefatura { background: #fef7e0; color: #b06000; }
      .rol-tamizaje { background: #e6f4ea; color: #137333; }

      .accion-tag {
        font: 700 0.75rem var(--f-mono); padding: 2px 8px; border-radius: 6px;
      }
      .accion-login { background: #e6f4ea; color: #137333; }
      .accion-logout { background: #f1f3f4; color: #5f6368; }
      .accion-evaluar { background: #e8f0fe; color: #1a73e8; }
      .accion-reporte { background: #fef7e0; color: #b06000; }

      .modal-backdrop {
        position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: grid;
        place-items: center; z-index: 1000; padding: 20px;
      }
      .modal-card { width: 100%; max-width: 480px; box-shadow: 0 12px 40px rgba(0,0,0,0.25); }
      .modal-body { display: flex; flex-direction: column; gap: 14px; margin: 16px 0; }
      .modal-foot { display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--line); padding-top: 14px; }
    `,
  ],
})
export class AdminUsuariosComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly tab = signal<'usuarios' | 'bitacora'>('usuarios');
  readonly usuarios = signal<UsuarioAdmin[]>([]);
  readonly roles = signal<Rol[]>([]);
  readonly bitacora = signal<EntradaBitacora[]>([]);

  readonly error = signal<string | null>(null);
  readonly exito = signal<string | null>(null);
  readonly guardando = signal(false);
  mostrarModal = false;

  nuevo = {
    nombres: '',
    correo: '',
    password: '',
    idRol: 1,
  };

  ngOnInit() {
    this.cargarUsuarios();
    this.cargarRoles();
  }

  cargarUsuarios() {
    this.api.listarUsuariosAdmin().subscribe({
      next: (list) => this.usuarios.set(list),
      error: (err) => this.error.set(mensajeError(err)),
    });
  }

  cargarRoles() {
    this.api.listarRolesAdmin().subscribe({
      next: (roles) => {
        this.roles.set(roles);
        if (roles.length > 0) this.nuevo.idRol = roles[0].idRol;
      },
      error: () => {},
    });
  }

  cargarBitacora() {
    this.tab.set('bitacora');
    this.api.listarBitacoraAdmin(100).subscribe({
      next: (bit) => this.bitacora.set(bit),
      error: (err) => this.error.set(mensajeError(err)),
    });
  }

  activosCount(): number {
    return this.usuarios().filter((u) => u.activo).length;
  }

  inactivosCount(): number {
    return this.usuarios().filter((u) => !u.activo).length;
  }

  toggleActivo(u: UsuarioAdmin) {
    const nuevoEstado = !u.activo;
    this.api.toggleActivoUsuario(u.idUsuario, nuevoEstado).subscribe({
      next: () => {
        this.usuarios.update((prev) =>
          prev.map((item) => (item.idUsuario === u.idUsuario ? { ...item, activo: nuevoEstado } : item)),
        );
        this.exito.set(`Usuario ${u.nombres} ${nuevoEstado ? 'activado' : 'desactivado'} con éxito.`);
        setTimeout(() => this.exito.set(null), 4000);
      },
      error: (err) => this.error.set(mensajeError(err)),
    });
  }

  crearUsuario() {
    if (!this.nuevo.nombres || !this.nuevo.correo || !this.nuevo.password) {
      this.error.set('Por favor complete todos los campos requeridos.');
      return;
    }
    this.guardando.set(true);
    this.error.set(null);

    this.api.crearUsuarioAdmin(this.nuevo).subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarModal();
        this.cargarUsuarios();
        this.exito.set('Nuevo usuario del personal creado satisfactoriamente.');
        setTimeout(() => this.exito.set(null), 4000);
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(mensajeError(err));
      },
    });
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.nuevo = { nombres: '', correo: '', password: '', idRol: 1 };
  }

  getRolClass(rol: string): string {
    switch (rol) {
      case 'Admin': return 'rol-admin';
      case 'Médico': return 'rol-medico';
      case 'Jefatura': return 'rol-jefatura';
      default: return 'rol-tamizaje';
    }
  }

  getAccionClass(accion: string): string {
    switch (accion) {
      case 'LOGIN': return 'accion-login';
      case 'LOGOUT': return 'accion-logout';
      case 'EVALUAR': return 'accion-evaluar';
      case 'DESCARGAR_REPORTE': return 'accion-reporte';
      default: return '';
    }
  }
}
