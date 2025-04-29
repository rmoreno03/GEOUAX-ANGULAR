import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CrearRutaComponent } from './pages/crear-ruta/crear-ruta.component';
import { MisRutasComponent } from './pages/mis-rutas/mis-rutas.component';
import { VerTodasComponent } from './pages/ver-todas/ver-todas.component';
import { DetalleRutaComponent } from './pages/detalle-ruta/detalle-ruta.component';
import { RutasPublicasComponent } from './pages/rutas-publicas/rutas-publicas.component';

const routes: Routes = [
  {
    path: '',
    children: [
      { path: 'crear', component: CrearRutaComponent },
      { path: 'mapa', component: VerTodasComponent },
      { path: 'detalle/:id', component: DetalleRutaComponent },
      { path: 'publicas', component: RutasPublicasComponent },
      { path: 'mis-rutas', component: MisRutasComponent },
      { path: '', redirectTo: 'mis-rutas', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RutasRoutingModule { }
