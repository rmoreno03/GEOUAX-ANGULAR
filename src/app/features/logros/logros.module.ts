import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LogrosRoutingModule } from './logros-routing.module';
import { VerLogrosComponent } from './pages/ver-logros/ver-logros.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MisRetosComponent } from './pages/mis-retos/mis-retos.component';
import { ProgresoComponent } from './pages/progreso/progreso.component';
import { CrearRetoPersonalizadoComponent } from './pages/crear-reto-personalizado/crear-reto-personalizado.component';
import { RankingUsuariosComponent } from './pages/ranking-usuarios/ranking-usuarios.component';


@NgModule({
  declarations: [
    VerLogrosComponent,
    MisRetosComponent,
    ProgresoComponent,
    CrearRetoPersonalizadoComponent,
    RankingUsuariosComponent
  ],
  imports: [
    CommonModule,
    LogrosRoutingModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class LogrosModule { }
