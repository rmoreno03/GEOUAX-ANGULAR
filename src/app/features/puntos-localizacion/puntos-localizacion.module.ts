import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PuntosLocalizacionComponent } from './components/puntos-localizacion/puntos-localizacion.component';
import { PuntosLocalizacionRoutingModule } from './puntos-localizacion-routing.module';
import { CrearPuntoComponent } from './pages/crear-punto/crear-punto.component';
import { DetallePuntoComponent } from './pages/detalle-punto/detalle-punto.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';





@NgModule({
  declarations: [
    PuntosLocalizacionComponent,
    CrearPuntoComponent,
    DetallePuntoComponent,
  ],
  imports: [
    CommonModule,
    PuntosLocalizacionRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule
  ]
})
export class PuntosLocalizacionModule { }
