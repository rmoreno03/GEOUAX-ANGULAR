import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PerfilRoutingModule } from './perfil-routing.module';
import { MiPerfilComponent } from './pages/mi-perfil/mi-perfil.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PerfilUsuarioComponent } from './pages/perfil-usuario/perfil-usuario.component';
import { NotificacionesSolicitudesComponent } from './components/notificaciones-solicitudes/notificaciones-solicitudes.component';
import { SolicitudesAmistadComponent } from './pages/solicitudes-amistad/solicitudes-amistad.component';
import { NotificacionesComponent } from './components/notificaciones/notificaciones.component';
import { SharedModule } from '../../shared/shared.module';
import { EditarPerfilComponent } from './pages/editar-perfil/editar-perfil.component';
import { AjustesCuentaComponent } from './pages/ajustes-cuenta/ajustes-cuenta.component';


@NgModule({
  declarations: [
    MiPerfilComponent,
    PerfilUsuarioComponent,
    NotificacionesSolicitudesComponent,
    SolicitudesAmistadComponent,
    NotificacionesComponent,
    EditarPerfilComponent,
    AjustesCuentaComponent
  ],
  imports: [
    CommonModule,
    PerfilRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule
  ]
})
export class PerfilModule { }
