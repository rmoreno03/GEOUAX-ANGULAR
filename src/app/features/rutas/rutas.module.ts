import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RutasRoutingModule } from './rutas-routing.module';
import { CrearRutaComponent } from './pages/crear-ruta/crear-ruta.component';
import { ReactiveFormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';


@NgModule({
  declarations: [
    CrearRutaComponent
  ],
  imports: [
    CommonModule,
    RutasRoutingModule,
    ReactiveFormsModule,
    DropdownModule
  ]
})
export class RutasModule { }
