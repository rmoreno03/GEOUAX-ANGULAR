import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EstadisticasRoutingModule } from './estadisticas-routing.module';
import { EstadisticasComponent } from './pages/estadisticas/estadisticas.component';
import { SharedModule } from 'primeng/api';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ComparativasComponent } from './pages/comparativas/comparativas.component';
import { ResumenGlobalComponent } from './pages/resumen-global/resumen-global.component';
import { ImpactoMedioambientalComponent } from './pages/impacto-medioambiental/impacto-medioambiental.component';
import { EstadisticasRegionComponent } from './pages/estadisticas-region/estadisticas-region.component';


@NgModule({
  declarations: [
    EstadisticasComponent,
    ComparativasComponent,
    ResumenGlobalComponent,
    ImpactoMedioambientalComponent,
    EstadisticasRegionComponent,
  ],
  imports: [
    CommonModule,
    EstadisticasRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule
  ]
})
export class EstadisticasModule { }
