import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RutasRoutingModule } from './rutas-routing.module';
import { CrearRutaComponent } from './pages/crear-ruta/crear-ruta.component';
import { ReactiveFormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { MisRutasComponent } from './pages/mis-rutas/mis-rutas.component';
import { VerTodasComponent } from './pages/ver-todas/ver-todas.component';
import { DetalleRutaComponent } from './pages/detalle-ruta/detalle-ruta.component';


@NgModule({
  declarations: [
    CrearRutaComponent,
    MisRutasComponent,
    VerTodasComponent,
    DetalleRutaComponent
  ],
  imports: [
    CommonModule,
    RutasRoutingModule,
    ReactiveFormsModule,
    DropdownModule
  ]
})
export class RutasModule { }
