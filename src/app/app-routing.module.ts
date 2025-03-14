import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PuntosLocalizacionComponent } from './components/puntos-localizacion/puntos-localizacion.component';

const routes: Routes = [
  { path: '', redirectTo: '/puntos', pathMatch: 'full' },
  { path: 'puntos', component: PuntosLocalizacionComponent },
  { path: '**', redirectTo: '/puntos' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }