import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PuntosLocalizacionComponent } from './components/puntos-localizacion/puntos-localizacion.component';

export const routes: Routes = [
  {
    path: '',
    component: PuntosLocalizacionComponent,
    children: [
      // Aquí puedes agregar más rutas hijas en el futuro
      // { path: 'subruta', component: SubrutaComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PuntosLocalizacionRoutingModule { }
