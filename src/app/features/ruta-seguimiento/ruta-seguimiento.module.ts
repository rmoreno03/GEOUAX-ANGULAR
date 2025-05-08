import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RutaSeguimientoRoutingModule } from './ruta-seguimiento-routing.module';
import { SeguirRutaComponent } from './components/seguir-ruta/seguir-ruta.component';
import { SharedModule } from '../../shared/shared.module';


@NgModule({
  declarations: [
    SeguirRutaComponent
  ],
  imports: [
    CommonModule,
    RutaSeguimientoRoutingModule,
    SharedModule
  ]
})
export class RutaSeguimientoModule { }
