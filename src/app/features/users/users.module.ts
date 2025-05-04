import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UsersRoutingModule } from './users-routing.module';
import { ListaUsuariosComponent } from './pages/lista-usuarios/lista-usuarios.component';
import { NuevoUsuarioComponent } from './pages/nuevo-usuario/nuevo-usuario.component';
import { RolesComponent } from './pages/roles/roles.component';
import { EstadisticasUsuarioComponent } from './pages/estadisticas-usuario/estadisticas-usuario.component';
import { UsuariosInactivosComponent } from './pages/usuarios-inactivos/usuarios-inactivos.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    ListaUsuariosComponent,
    NuevoUsuarioComponent,
    RolesComponent,
    EstadisticasUsuarioComponent,
    UsuariosInactivosComponent
  ],
  imports: [
    CommonModule,
    UsersRoutingModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class UsersModule { }
