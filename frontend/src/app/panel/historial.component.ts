import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, mensajeError } from '../core/api.service';
import { FilaHistorial } from '../core/models';
import { IconComponent } from '../shared/icon.component';

/** HU07: historial de evaluaciones guardadas en MySQL, con búsqueda, filtros y exportación. */
@Component({
  selector: 'app-historial',
  imports: [DecimalPipe, DatePipe, FormsModule, RouterLink, IconComponent],
  template: `
    <div class="page-head">
      <div>
        <span class="eyebrow">HU07 · Datos guardados en MySQL</span>
        <h1>Historial de evaluaciones</h1>
        <p class="muted">Las evaluaciones no se pueden modificar ni eliminar una vez registradas.</p>
      </div>
      <div class="page-head-r">
        <button class="btn ghost" type="button" (click)="cargar()"><app-icon name="refresh" [size]="18" /> Actualizar</button>
        <button class="btn" type="button" (click)="exportar()" [disabled]="!filtradas().length"><app-icon name="download" [size]="18" /> Exportar CSV</button>
      </div>
    </div>

    <div class="toolbar card">
      <span class="inp with-ico search">
        <app-icon name="search" [size]="18" />
        <input type="search" name="q" [(ngModel)]="busqueda" placeholder="Buscar por código, por ejemplo P-000003" />
      </span>
      <div class="seg" role="group" aria-label="Filtrar por nivel">
        @for (n of niveles; track n) {
          <button type="button" [attr.aria-pressed]="nivel === n" (click)="nivel = n">{{ n }}
            <small class="seg-count">{{ conteo(n) }}</small>
          </button>
        }
      </div>
      <select class="select" name="canal" [(ngModel)]="canal" aria-label="Filtrar por canal">
        <option value="Todos">Todos los canales</option>
        <option value="Autoevaluación web">Autoevaluación web</option>
        <option value="Tamizaje asistido">Tamizaje asistido</option>
      </select>
    </div>

    @if (error()) {
      <div class="alert" role="alert"><app-icon name="alert" [size]="18" /> {{ error() }}</div>
    }

    <div class="tablewrap">
      <table>
        <thead>
          <tr><th>Código</th><th>Fecha y hora</th><th>Canal</th><th>Sexo</th><th>Edad</th><th>IMC</th><th>Glucosa</th><th>Probabilidad</th><th>Nivel</th><th>Registró</th></tr>
        </thead>
        <tbody>
          @for (f of filtradas(); track f.idEvaluacion) {
            <tr>
              <td class="num strong">{{ f.codigo }}</td>
              <td class="num">{{ f.fechaHora | date: 'dd/MM/yyyy HH:mm' }}</td>
              <td><span class="canal-tag"><app-icon [name]="f.canal === 'Tamizaje asistido' ? 'stethoscope' : 'user'" [size]="14" /> {{ f.canal }}</span></td>
              <td>{{ f.sexo === 'F' ? 'Mujer' : 'Hombre' }}</td>
              <td class="num">{{ f.edad }}</td>
              <td class="num">{{ f.imc | number: '1.1-1' }}</td>
              <td class="num">{{ f.glucosa === null ? '—' : (f.glucosa | number: '1.0-0') }}</td>
              <td class="num">
                <span class="pbar"><i [class]="f.nivel" [style.width.%]="f.probabilidad * 100"></i></span>
                {{ f.probabilidad * 100 | number: '1.1-1' }} %
              </td>
              <td><span [class]="'level small ' + f.nivel">{{ f.nivel }}</span></td>
              <td>{{ f.registradoPor }}</td>
            </tr>
          } @empty {
            <tr>
              <td colspan="10" class="empty">
                @if (cargando()) {
                  Cargando…
                } @else {
                  No hay evaluaciones con estos filtros. <a routerLink="../nueva">Registrar una evaluación</a>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
    <p class="note">Mostrando {{ filtradas().length }} de {{ filas().length }} evaluaciones.</p>
  `,
})
export class HistorialComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly niveles = ['Todos', 'Bajo', 'Moderado', 'Alto'];
  nivel = 'Todos';
  canal = 'Todos';
  busqueda = '';
  readonly filas = signal<FilaHistorial[]>([]);
  readonly cargando = signal(false);
  readonly error = signal('');

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.error.set('');
    this.api.historial('Todos').subscribe({
      next: (f) => {
        this.filas.set(f);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  conteo(n: string): number {
    return n === 'Todos' ? this.filas().length : this.filas().filter((f) => f.nivel === n).length;
  }

  filtradas(): FilaHistorial[] {
    const q = this.busqueda.trim().toUpperCase();
    return this.filas().filter(
      (f) =>
        (this.nivel === 'Todos' || f.nivel === this.nivel) &&
        (this.canal === 'Todos' || f.canal === this.canal) &&
        (!q || f.codigo.toUpperCase().includes(q)),
    );
  }

  exportar() {
    const cab = ['codigo', 'fecha_hora', 'canal', 'sexo', 'edad', 'imc', 'glucosa', 'probabilidad', 'nivel', 'registrado_por'];
    const filas = this.filtradas().map((f) =>
      [f.codigo, new Date(f.fechaHora).toLocaleString('es-PE'), f.canal, f.sexo, f.edad, f.imc, f.glucosa ?? '', f.probabilidad, f.nivel, f.registradoPor]
        .map((v) => '"' + String(v).replace(/"/g, '""') + '"')
        .join(';'),
    );
    const csv = '﻿' + [cab.join(';'), ...filas].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'historial-evaluaciones.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
