import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PuntosLocalizacionComponent } from './components/puntos-localizacion/puntos-localizacion.component';
import { CrearPuntoComponent } from './pages/crear-punto/crear-punto.component';
import { DetallePuntoComponent } from './pages/detalle-punto/detalle-punto.component';

export const routes: Routes = [
  { path: '', component: PuntosLocalizacionComponent },
  { path: 'nuevo', component: CrearPuntoComponent },
  { path: ':id', component: DetallePuntoComponent },
  { path: '**', redirectTo: ''} // Redirigir a la lista de puntos si la ruta no coincide
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PuntosLocalizacionRoutingModule { }
