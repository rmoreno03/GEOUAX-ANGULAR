import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EstadisticasComponent } from './pages/estadisticas/estadisticas.component';

const routes: Routes = [
  //{ path: 'resumen-global', component: ResumenGlobalComponent },
  { path: 'mis-estadisticas', component: EstadisticasComponent },
  //{ path: 'comparativas', component: ComparativasComponent },
  //{ path: 'impacto-medioambiental', component: ImpactoMedioambientalComponent },
  //{ path: 'estadisticas-region', component: EstadisticasRegionComponent },
  { path: '', redirectTo: 'mis-estadisticas', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EstadisticasRoutingModule { }
