import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AjustesMapaComponent } from './pages/ajustes-mapa/ajustes-mapa.component';
import { AparienciaTemaComponent } from './pages/apariencia-tema/apariencia-tema.component';
import { IdiomaRegionComponent } from './pages/idioma-region/idioma-region.component';
import { NotificacionesComponent } from './pages/notificaciones/notificaciones.component';
import { PreferenciasUsuarioComponent } from './pages/preferencias-usuario/preferencias-usuario.component';

const routes: Routes = [
    { path: 'preferencias-usuario', component: PreferenciasUsuarioComponent },
    { path: 'ajustes-mapa', component: AjustesMapaComponent },
    { path: 'notificaciones', component: NotificacionesComponent },
    { path: 'idioma-region', component: IdiomaRegionComponent },
    { path: 'apariencia-tema', component: AparienciaTemaComponent },
    { path: '', redirectTo: 'preferencias-usuario', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SettingsRoutingModule { }
