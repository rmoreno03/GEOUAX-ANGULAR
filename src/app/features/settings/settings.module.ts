import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SettingsRoutingModule } from './settings-routing.module';
import { PreferenciasUsuarioComponent } from './pages/preferencias-usuario/preferencias-usuario.component';
import { AjustesMapaComponent } from './pages/ajustes-mapa/ajustes-mapa.component';
import { NotificacionesComponent } from './pages/notificaciones/notificaciones.component';
import { IdiomaRegionComponent } from './pages/idioma-region/idioma-region.component';
import { AparienciaTemaComponent } from './pages/apariencia-tema/apariencia-tema.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    PreferenciasUsuarioComponent,
    AjustesMapaComponent,
    NotificacionesComponent,
    IdiomaRegionComponent,
    AparienciaTemaComponent
  ],
  imports: [
    CommonModule,
    SettingsRoutingModule,
    ReactiveFormsModule,
    FormsModule
  ]
})
export class SettingsModule { }
