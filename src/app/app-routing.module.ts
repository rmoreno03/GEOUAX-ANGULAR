import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: '/puntos', pathMatch: 'full' },
  {
    path: 'puntos',
    loadChildren: () => import('./features/puntos-localizacion/puntos-localizacion.module').then(m => m.PuntosLocalizacionModule)
  },
  { path: '**', redirectTo: '/puntos' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
