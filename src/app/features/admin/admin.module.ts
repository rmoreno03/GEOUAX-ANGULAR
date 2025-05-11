import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { GestionUsuariosComponent } from './pages/gestion-usuarios/gestion-usuarios.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PermisosRolesComponent } from './pages/permisos-roles/permisos-roles.component';
import { ContenidoReportadoComponent } from './pages/contenido-reportado/contenido-reportado.component';
import { AuditoriaLogsComponent } from './pages/auditoria-logs/auditoria-logs.component';
import { ConfiguracionGeneralComponent } from './pages/configuracion-general/configuracion-general.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { SharedModule } from '../../shared/shared.module';
import { UserDetailComponent } from './pages/user-detail/user-detail.component';
import { UserEditComponent } from './pages/user-edit/user-edit.component';


@NgModule({
  declarations: [
    GestionUsuariosComponent,
    PermisosRolesComponent,
    ContenidoReportadoComponent,
    AuditoriaLogsComponent,
    ConfiguracionGeneralComponent,
    AdminDashboardComponent,
    UserDetailComponent,
    UserEditComponent
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule
  ]
})
export class AdminModule { }
