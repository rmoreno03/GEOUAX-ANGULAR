import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GestionUsuariosComponent } from './pages/gestion-usuarios/gestion-usuarios.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { PermisosRolesComponent } from './pages/permisos-roles/permisos-roles.component';
import { AuditoriaLogsComponent } from './pages/auditoria-logs/auditoria-logs.component';
import { ConfiguracionGeneralComponent } from './pages/configuracion-general/configuracion-general.component';
import { ContenidoReportadoComponent } from './pages/contenido-reportado/contenido-reportado.component';

const routes: Routes = [
  { path: '', component: AdminDashboardComponent },

  { path: 'gestion-usuarios', component: GestionUsuariosComponent },
  { path: 'roles', component: PermisosRolesComponent },
  { path: 'reportes', component: ContenidoReportadoComponent },
  { path: 'logs', component: AuditoriaLogsComponent },
  { path: 'configuracion', component: ConfiguracionGeneralComponent },

  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
