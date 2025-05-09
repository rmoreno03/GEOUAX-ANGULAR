import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MiPerfilComponent } from './pages/mi-perfil/mi-perfil.component';
import { PerfilUsuarioComponent } from './pages/perfil-usuario/perfil-usuario.component';
import { SolicitudesAmistadComponent } from './pages/solicitudes-amistad/solicitudes-amistad.component';
import { AjustesCuentaComponent } from './pages/ajustes-cuenta/ajustes-cuenta.component';
import { EditarPerfilComponent } from './pages/editar-perfil/editar-perfil.component';

const routes: Routes = [
  { path: '', redirectTo: 'mi-perfil', pathMatch: 'full' },
  { path: 'mi-perfil', component: MiPerfilComponent },
  { path: 'editar', component: EditarPerfilComponent },
  { path: 'ajustes', component: AjustesCuentaComponent },
  { path: 'ver/:uid', component: PerfilUsuarioComponent },
  { path: 'solicitudes', component: SolicitudesAmistadComponent },
  { path: ':uid', redirectTo: 'ver/:uid' },
  { path: '**', redirectTo: 'mi-perfil' }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PerfilRoutingModule { }
