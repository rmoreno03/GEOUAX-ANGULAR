import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaUsuariosComponent } from './pages/lista-usuarios/lista-usuarios.component';
import { EstadisticasUsuarioComponent } from './pages/estadisticas-usuario/estadisticas-usuario.component';
import { NuevoUsuarioComponent } from './pages/nuevo-usuario/nuevo-usuario.component';
import { RolesComponent } from './pages/roles/roles.component';
import { UsuariosInactivosComponent } from './pages/usuarios-inactivos/usuarios-inactivos.component';

const routes: Routes = [
  { path: '', component: ListaUsuariosComponent },
  { path: 'nuevo-usuario', component: NuevoUsuarioComponent },
  { path: 'roles', component: RolesComponent },
  { path: 'estadisticas-por-usuario', component: EstadisticasUsuarioComponent },
  { path: 'usuarios-inactivos', component: UsuariosInactivosComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UsersRoutingModule { }
