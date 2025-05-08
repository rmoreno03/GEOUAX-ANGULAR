import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SeguirRutaComponent } from './components/seguir-ruta/seguir-ruta.component';

const routes: Routes = [
  {
    path: ':id',
    component: SeguirRutaComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RutaSeguimientoRoutingModule { }
