import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService, mensajeError } from '../core/api.service';
import { FilaHistorial, ReporteClinico } from '../core/models';
import { IconComponent } from '../shared/icon.component';

@Component({
  selector: 'app-reportes',
  imports: [DecimalPipe, DatePipe, IconComponent],
  template: `
    <div class="page-head no-print">
      <div>
        <span class="eyebrow">Sprint 2 · Documentos Clínicos</span>
        <h1>Reportes Médicos</h1>
        <p class="muted">
          Generación e impresión de informes formales de tamizaje clínico con auditoría de descarga (HU11).
        </p>
      </div>
      <div class="page-head-r">
        @if (reporte()) {
          <button type="button" class="btn lg" (click)="imprimir()">
            <app-icon name="print" [size]="18" /> Imprimir o Guardar PDF
          </button>
        }
      </div>
    </div>

    <!-- SELECTOR DE EVALUACIÓN (SOLO EN PANTALLA) -->
    <div class="card no-print" style="margin-bottom: 20px;">
      <div class="card-head">
        <h3><app-icon name="file" [size]="18" /> Seleccionar evaluación para generar informe</h3>
      </div>
      <div class="selector-row">
        <select class="select" [value]="idSeleccionado() ?? ''" (change)="onSelectEvaluacion($event)">
          <option value="" disabled>-- Seleccione un código de evaluación --</option>
          @for (e of lista(); track e.idEvaluacion) {
            <option [value]="e.idEvaluacion">
              {{ e.codigo }} · Riesgo {{ e.nivel }} · {{ e.edad }} años · {{ e.fechaHora | date: 'dd/MM/yyyy HH:mm' }}
            </option>
          }
        </select>
      </div>
    </div>

    @if (error()) {
      <div class="alert no-print" role="alert">
        <app-icon name="alert" [size]="18" /> {{ error() }}
      </div>
    }

    @if (cargando()) {
      <div class="card empty-state no-print">
        <span class="spin"></span>
        <p>Generando reporte clínico...</p>
      </div>
    }

    <!-- DOCUMENTO FORMAL A4 (VISUALIZABLE E IMPRIMIBLE) -->
    @if (reporte(); as rep) {
      <div class="report-sheet">
        <!-- Encabezado Oficial -->
        <header class="rep-header">
          <div class="rep-inst">
            <span class="inst-top">CENTRO DE ATENCIÓN PRIMARIA · URBANIZACIÓN LOS CEDROS DE VILLA</span>
            <span class="inst-sub">MUNICIPALIDAD DE CHORRILLOS — RED DE SALUD INTEGRADA</span>
            <h2 class="rep-title">INFORME DE ESTIMACIÓN DE RIESGO DE DIABETES MELLITUS TIPO 2</h2>
            <span class="rep-sub">SISTEMA WEB PREDICTIVO CON INTELIGENCIA ARTIFICIAL "CEDROS PREVIENE"</span>
          </div>
          <div class="rep-badge-code">
            <span class="code-lbl">CÓDIGO DE EVALUACIÓN</span>
            <b class="code-val mono">{{ rep.codigoAnonimo }}</b>
            <span class="code-date">{{ rep.fechaEvaluacion | date: 'dd/MM/yyyy HH:mm' }}</span>
          </div>
        </header>

        <hr class="rep-div" />

        <!-- Datos del Participante y Medidas -->
        <section class="rep-sec">
          <h4 class="sec-title">1. DATOS DEL PARTICIPANTE (ANONIMIZADOS — LEY N° 29733)</h4>
          <div class="rep-grid-3">
            <div class="field-item">
              <span class="f-lbl">Código Único:</span>
              <b class="f-val mono">{{ rep.codigoAnonimo }}</b>
            </div>
            <div class="field-item">
              <span class="f-lbl">Sexo:</span>
              <b class="f-val">{{ rep.sexo === 'F' ? 'Femenino' : 'Masculino' }}</b>
            </div>
            <div class="field-item">
              <span class="f-lbl">Edad Cronológica:</span>
              <b class="f-val">{{ rep.edad }} años</b>
            </div>
            <div class="field-item">
              <span class="f-lbl">Canal de Tamizaje:</span>
              <b class="f-val">{{ rep.canal }}</b>
            </div>
            <div class="field-item">
              <span class="f-lbl">Personal Evaluador:</span>
              <b class="f-val">{{ rep.evaluador || 'Autoevaluación digital' }} ({{ rep.rolEvaluador || 'Web' }})</b>
            </div>
            <div class="field-item">
              <span class="f-lbl">Consentimiento Informado:</span>
              <b class="f-val" style="color: #137333;">Aceptado explícitamente</b>
            </div>
          </div>
        </section>

        <!-- Medidas Clínicas y Antropométricas -->
        <section class="rep-sec">
          <h4 class="sec-title">2. VARIABLES CLÍNICAS Y ANTROPOMÉTRICAS REGISTRADAS</h4>
          <table class="rep-table">
            <thead>
              <tr>
                <th>Variable Clínica</th>
                <th>Valor Observado</th>
                <th>Rango de Referencia</th>
                <th>Condición / Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><b>Índice de Masa Corporal (IMC)</b></td>
                <td class="mono"><b>{{ rep.imc | number: '1.1-1' }} kg/m²</b></td>
                <td>18.5 – 24.9 (Normal)</td>
                <td>{{ getCategoriaImc(rep.imc) }}</td>
              </tr>
              <tr>
                <td><b>Glucosa Plasmática en Ayunas</b></td>
                <td class="mono">
                  {{ rep.glucosa !== null ? (rep.glucosa + ' mg/dL') : 'No registrada' }}
                </td>
                <td>70 – 99 mg/dL (Normal)</td>
                <td>
                  {{ rep.camposImputados.includes('glucosa') ? 'Imputada por mediana técnica (HU03)' : (rep.glucosa && rep.glucosa >= 100 ? 'Elevada' : 'Normal') }}
                </td>
              </tr>
              <tr>
                <td><b>Presión Arterial Diastólica</b></td>
                <td class="mono">
                  {{ rep.presionDiastolica !== null ? (rep.presionDiastolica + ' mmHg') : 'No registrada' }}
                </td>
                <td>60 – 80 mmHg (Normal)</td>
                <td>
                  {{ rep.camposImputados.includes('presion_diastolica') ? 'Imputada por mediana técnica (HU03)' : (rep.presionDiastolica && rep.presionDiastolica > 80 ? 'Elevada' : 'Normal') }}
                </td>
              </tr>
              <tr>
                <td><b>Número de Embarazos</b></td>
                <td class="mono">{{ rep.embarazos }}</td>
                <td>0 – 20</td>
                <td>{{ rep.sexo === 'M' ? 'No aplica (Hombre)' : 'Registrado' }}</td>
              </tr>
              <tr>
                <td><b>Pliegue Cutáneo Tricipital</b></td>
                <td class="mono">
                  {{ rep.pliegueCutaneo !== null ? (rep.pliegueCutaneo + ' mm') : 'No registrado' }}
                </td>
                <td>10 – 30 mm</td>
                <td>{{ rep.camposImputados.includes('pliegue_cutaneo') ? 'Completado con valor típico' : 'Medido' }}</td>
              </tr>
              <tr>
                <td><b>Insulina Sérica</b></td>
                <td class="mono">
                  {{ rep.insulina !== null ? (rep.insulina + ' µU/mL') : 'No registrada' }}
                </td>
                <td>16 – 166 µU/mL</td>
                <td>{{ rep.camposImputados.includes('insulina') ? 'Completado con valor típico' : 'Medido' }}</td>
              </tr>
              <tr>
                <td><b>Antecedente Familiar (Diabetes Pedigree)</b></td>
                <td class="mono">Índice: {{ rep.pedigreeDiabetes | number: '1.2-2' }}</td>
                <td>0.08 – 2.42</td>
                <td>{{ rep.antecedenteFamiliar || 'Calculado' }}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <!-- Estimación Predictiva -->
        <section class="rep-sec">
          <h4 class="sec-title">3. RESULTADO DE LA ESTIMACIÓN DE RIESGO (MACHINE LEARNING)</h4>
          <div class="res-box" [class]="'tone-' + rep.nivelRiesgo">
            <div class="res-main">
              <span class="res-lbl">Nivel de Riesgo Estimado a 5 años:</span>
              <b class="res-level">RIESGO {{ rep.nivelRiesgo | uppercase }}</b>
              <span class="res-prob">
                Probabilidad Calculada: <b>{{ rep.probabilidad * 100 | number: '1.1-1' }}%</b>
              </span>
            </div>
            <div class="res-meta">
              <span><b>Modelo:</b> {{ rep.versionModelo }} ({{ rep.algoritmoModelo }})</span>
              <span><b>Tiempo de inferencia:</b> {{ rep.tiempoRespuestaMs }} ms</span>
              <span><b>Umbrales clínicos:</b> Bajo &lt; 15% · Moderado 15-50% · Alto &ge; 50%</span>
            </div>
          </div>
        </section>

        <!-- Factores Explicativos (Explainable AI) -->
        <section class="rep-sec">
          <h4 class="sec-title">4. FACTORES DE MAYOR INFLUENCIA CLÍNICA (EXPLICABILIDAD DE IA)</h4>
          <div class="rep-grid-2">
            @for (f of rep.factores.slice(0, 4); track f.variable) {
              <div class="fact-card">
                <b>{{ f.variable }}</b>
                <span class="small muted">Valor: {{ f.valor | number: '1.0-2' }}</span>
                <span [style.color]="f.contribucion >= 0 ? '#c5221f' : '#137333'" style="font-weight: 700;">
                  {{ f.contribucion >= 0 ? '▲ Aumenta riesgo' : '▼ Reduce riesgo' }}
                  ({{ f.contribucion * 100 | number: '1.1-1' }} pp)
                </span>
              </div>
            }
          </div>
        </section>

        <!-- Conducta y Recomendaciones -->
        <section class="rep-sec">
          <h4 class="sec-title">5. CONDUCTA SUGERIDA Y RECOMENDACIONES CLÍNICAS</h4>
          <ul class="reco-list">
            @if (rep.nivelRiesgo === 'Alto') {
              <li><b>Derivación médica inmediata:</b> Se recomienda solicitar prueba confirmatoria de glucosa en ayunas o hemoglobina glicosilada (HbA1c).</li>
              <li><b>Intervención en estilo de vida:</b> Iniciar consejería nutricional y programa de actividad física guiada de al menos 150 min/semana.</li>
              <li><b>Monitoreo cercano:</b> Programar cita de control médico dentro de los próximos 30 días.</li>
            } @else if (rep.nivelRiesgo === 'Moderado') {
              <li><b>Tamizaje de laboratorio:</b> Se sugiere evaluación de glucemia en ayunas en los próximos 3 meses.</li>
              <li><b>Manejo de peso:</b> Si el IMC es superior a 25, reducir entre el 5% y 7% del peso corporal previene significativamente el desarrollo de la enfermedad.</li>
              <li><b>Reevaluación:</b> Repetir el tamizaje clínico en un plazo de 6 meses.</li>
            } @else {
              <li><b>Mantenimiento de hábitos saludables:</b> Reforzar dieta balanceada rica en fibra y vegetales, evitando bebidas azucaradas.</li>
              <li><b>Actividad física continua:</b> Mantener un mínimo de 150 minutos semanales de actividad aeróbica moderada.</li>
              <li><b>Control preventivo:</b> Repetir la estimación de riesgo en 12 meses.</li>
            }
          </ul>
        </section>

        <!-- Pie y Firma -->
        <footer class="rep-footer">
          <div class="legal-box">
            <small>
              <b>Aviso de confidencialidad y descargo legal:</b> El presente informe es una estimación probabilística de apoyo a la toma de decisiones clínicas y no reemplaza el diagnóstico médico de laboratorio. Conforme a la Ley N° 29733 de Protección de Datos Personales, no se procesan datos nominativos directos del evaluado.
            </small>
          </div>
          <div class="sig-row">
            <div class="sig-box">
              <div class="sig-line"></div>
              <span>Firma / Sello del Evaluador</span>
              <small class="muted">{{ rep.evaluador || 'Personal de Tamizaje' }}</small>
            </div>
            <div class="sig-box">
              <div class="sig-line"></div>
              <span>V.° B.° Jefatura de Salud</span>
              <small class="muted">Centro de Salud Los Cedros de Villa</small>
            </div>
          </div>
        </footer>
      </div>
    }
  `,
  styles: [
    `
      .selector-row { display: flex; gap: 14px; margin-top: 8px; }

      /* Estilo A4 tipo documento médico */
      .report-sheet {
        background: #ffffff; color: #1a1a1a; border: 1px solid var(--line);
        border-radius: var(--r); padding: 40px; box-shadow: var(--shadow);
        max-width: 860px; margin: 0 auto 40px auto; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      }

      .rep-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }
      .rep-inst { display: flex; flex-direction: column; gap: 3px; }
      .inst-top { font-size: 0.75rem; font-weight: 800; color: #5f6368; letter-spacing: 0.05em; }
      .inst-sub { font-size: 0.72rem; color: #70757a; font-weight: 600; }
      .rep-title { font-size: 1.15rem; font-weight: 900; margin: 8px 0 2px 0; color: #1a73e8; }
      .rep-sub { font-size: 0.75rem; color: #5f6368; font-weight: 600; }

      .rep-badge-code {
        display: flex; flex-direction: column; align-items: flex-end;
        background: #f8f9fa; border: 1px solid #dadce0; border-radius: 8px; padding: 10px 14px;
      }
      .code-lbl { font-size: 0.65rem; font-weight: 800; color: #5f6368; }
      .code-val { font-size: 1.25rem; font-weight: 900; color: #202124; }
      .code-date { font-size: 0.7rem; color: #70757a; }

      .rep-div { border: 0; border-top: 2px solid #202124; margin: 16px 0 20px 0; }
      .rep-sec { margin-bottom: 22px; }
      .sec-title {
        font-size: 0.85rem; font-weight: 800; color: #202124; border-bottom: 1px solid #e8eaed;
        padding-bottom: 4px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.03em;
      }

      .rep-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
      .rep-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .field-item { font-size: 0.82rem; }
      .f-lbl { color: #5f6368; display: block; font-size: 0.72rem; font-weight: 600; }
      .f-val { color: #202124; }

      .rep-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; margin-top: 6px; }
      .rep-table th, .rep-table td { border: 1px solid #dadce0; padding: 7px 10px; text-align: left; }
      .rep-table th { background: #f8f9fa; font-weight: 800; color: #3c4043; font-size: 0.76rem; }

      .res-box {
        border-radius: 8px; padding: 14px 18px; display: flex; justify-content: space-between;
        align-items: center; border: 2px solid #dadce0;
      }
      .res-box.tone-Bajo { background: #e6f4ea; border-color: #34a853; }
      .res-box.tone-Moderado { background: #fef7e0; border-color: #fbbc04; }
      .res-box.tone-Alto { background: #fce8e6; border-color: #ea4335; }

      .res-main { display: flex; flex-direction: column; gap: 2px; }
      .res-lbl { font-size: 0.75rem; font-weight: 700; color: #3c4043; }
      .res-level { font-size: 1.35rem; font-weight: 900; }
      .res-prob { font-size: 0.9rem; }
      .res-meta { display: flex; flex-direction: column; font-size: 0.75rem; color: #5f6368; text-align: right; gap: 2px; }

      .fact-card {
        background: #f8f9fa; border: 1px solid #e8eaed; border-radius: 6px;
        padding: 8px 12px; display: flex; flex-direction: column; font-size: 0.8rem;
      }

      .reco-list { font-size: 0.82rem; padding-left: 18px; margin: 6px 0; line-height: 1.45; }
      .reco-list li { margin-bottom: 6px; }

      .rep-footer { margin-top: 30px; display: flex; flex-direction: column; gap: 24px; }
      .legal-box { border-top: 1px solid #dadce0; padding-top: 10px; color: #70757a; line-height: 1.35; }
      .sig-row { display: flex; justify-content: space-around; margin-top: 35px; }
      .sig-box { display: flex; flex-direction: column; align-items: center; gap: 3px; font-size: 0.8rem; font-weight: 700; }
      .sig-line { width: 180px; border-top: 1px solid #202124; margin-bottom: 6px; }

      /* Imprimir limpio para PDF */
      @media print {
        .no-print { display: none !important; }
        body, .app, .app-main, .content { background: #ffffff !important; padding: 0 !important; margin: 0 !important; }
        .report-sheet { border: none !important; box-shadow: none !important; padding: 0 !important; max-width: 100% !important; margin: 0 !important; }
      }
    `,
  ],
})
export class ReportesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  readonly lista = signal<FilaHistorial[]>([]);
  readonly reporte = signal<ReporteClinico | null>(null);
  readonly idSeleccionado = signal<number | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit() {
    this.cargarHistorial();

    this.route.queryParams.subscribe((params) => {
      if (params['id']) {
        const id = Number(params['id']);
        this.idSeleccionado.set(id);
        this.cargarReporte(id);
      }
    });
  }

  cargarHistorial() {
    this.api.historial().subscribe({
      next: (list) => {
        this.lista.set(list);
        if (!this.idSeleccionado() && list.length > 0) {
          this.idSeleccionado.set(list[0].idEvaluacion);
          this.cargarReporte(list[0].idEvaluacion);
        }
      },
      error: () => {},
    });
  }

  onSelectEvaluacion(e: Event) {
    const target = e.target as HTMLSelectElement;
    const id = Number(target.value);
    if (id) {
      this.idSeleccionado.set(id);
      this.cargarReporte(id);
    }
  }

  cargarReporte(id: number) {
    this.cargando.set(true);
    this.error.set(null);
    this.api.obtenerReporteClinico(id).subscribe({
      next: (rep) => {
        this.reporte.set(rep);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  getCategoriaImc(imc: number): string {
    if (imc < 18.5) return 'Bajo peso';
    if (imc < 25) return 'Peso normal';
    if (imc < 30) return 'Sobrepeso';
    if (imc < 35) return 'Obesidad Clase I';
    if (imc < 40) return 'Obesidad Clase II';
    return 'Obesidad Mórbida';
  }

  imprimir() {
    window.print();
  }
}
