import { Routes } from '@angular/router';
import { adminGuard } from './core/admin.guard';
import { authGuard } from './core/auth.guard';
import { AdminUsuariosComponent } from './panel/admin-usuarios.component';
import { EncuestaComponent } from './panel/encuesta.component';
import { HistorialComponent } from './panel/historial.component';
import { InicioComponent } from './panel/inicio.component';
import { LoginComponent } from './panel/login.component';
import { NuevaEvaluacionComponent } from './panel/nueva-evaluacion.component';
import { PanelComponent } from './panel/panel.component';
import { ReportesComponent } from './panel/reportes.component';
import { LandingComponent } from './publico/landing.component';
import { TestPublicoComponent } from './publico/test-publico.component';

export const routes: Routes = [
  { path: '', component: LandingComponent, title: 'Cedros Previene · Riesgo de diabetes tipo 2' },
  { path: 'test', component: TestPublicoComponent, title: 'Cedros Previene · Test de riesgo' },
  { path: 'login', component: LoginComponent, title: 'Cedros Previene · Acceso del personal' },
  {
    path: 'panel',
    component: PanelComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      { path: 'inicio', component: InicioComponent, title: 'Panel · Inicio' },
      { path: 'nueva', component: NuevaEvaluacionComponent, title: 'Panel · Nueva evaluación' },
      { path: 'historial', component: HistorialComponent, title: 'Panel · Historial' },
      { path: 'encuesta', component: EncuestaComponent, title: 'Panel · Encuesta ISO 25010' },
      { path: 'reportes', component: ReportesComponent, title: 'Panel · Reportes PDF' },
      { path: 'usuarios', component: AdminUsuariosComponent, canActivate: [adminGuard], title: 'Panel · Gestión de Usuarios' },
    ],
  },
  { path: '**', redirectTo: '' },
];
