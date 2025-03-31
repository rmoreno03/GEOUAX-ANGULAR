import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PuntosLocalizacionComponent } from './components/puntos-localizacion/puntos-localizacion.component';
import { PuntosLocalizacionRoutingModule } from './puntos-localizacion-routing.module';



@NgModule({
  declarations: [
    PuntosLocalizacionComponent
  ],
  imports: [
    CommonModule,
    PuntosLocalizacionRoutingModule
  ]
})
export class PuntosLocalizacionModule { }
