import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PuntosLocalizacionComponent } from './components/puntos-localizacion/puntos-localizacion.component';
import { CrearPuntoComponent } from './components/crear-punto/crear-punto.component';
import { DetallePuntoComponent } from './components/detalle-punto/detalle-punto.component';
import { MapaPuntosComponent } from './components/mapa-puntos/mapa-puntos.component';

export const routes: Routes = [
  { path: '', component: PuntosLocalizacionComponent },
  { path: 'nuevo', component: CrearPuntoComponent },
  { path: 'mapa', component: MapaPuntosComponent},
  { path: ':id', component: DetallePuntoComponent },
  //{ path: 'editar/:id', component: CrearPuntoComponent },
  { path: '**', redirectTo: ''}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PuntosLocalizacionRoutingModule { }
