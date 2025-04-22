import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CrearRutaComponent } from './pages/crear-ruta/crear-ruta.component';

const routes: Routes = [
  {
    path: '',
    children: [
      { path: 'crear', component: CrearRutaComponent },
      //{ path: 'mapa', component: MapaRutasComponent },
      //{ path: 'publicas', component: RutasPublicasComponent },
      //{ path: 'mis-rutas', component: MisRutasComponent },
      { path: '', redirectTo: 'mis-rutas', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RutasRoutingModule { }
