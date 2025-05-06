import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MiPerfilComponent } from './pages/mi-perfil/mi-perfil.component';
import { PerfilUsuarioComponent } from './pages/perfil-usuario/perfil-usuario.component';
import { SolicitudesAmistadComponent } from './pages/solicitudes-amistad/solicitudes-amistad.component';

const routes: Routes = [
  { path: '', redirectTo: 'mi-perfil', pathMatch: 'full' },
  { path: 'mi-perfil', component: MiPerfilComponent },
  { path: 'ver/:uid', component: PerfilUsuarioComponent },
  { path: 'solicitudes', component: SolicitudesAmistadComponent },
  { path: ':uid', redirectTo: 'ver/:uid' },
  { path: '**', redirectTo: 'mi-perfil' } // Redirigir cualquier ruta no encontrada a mi-perfil
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PerfilRoutingModule { }
