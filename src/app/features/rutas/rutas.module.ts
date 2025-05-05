import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RutasRoutingModule } from './rutas-routing.module';
import { CrearRutaComponent } from './pages/crear-ruta/crear-ruta.component';
import { ReactiveFormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { MisRutasComponent } from './pages/mis-rutas/mis-rutas.component';
import { VerTodasComponent } from './pages/ver-todas/ver-todas.component';
import { DetalleRutaComponent } from './pages/detalle-ruta/detalle-ruta.component';
import { SharedModule } from '../../shared/shared.module';
import { RutasPublicasComponent } from './pages/rutas-publicas/rutas-publicas.component';
import { CoreModule } from '../../core/core.module';
import { HttpClientModule } from '@angular/common/http';
import { HuellaCarbonoComponent } from './components/huella-carbono/huella-carbono.component';
import { CompararTransportesComponent } from './components/comparar-transportes/comparar-transportes.component';
import { DialogModule } from 'primeng/dialog';




@NgModule({
  declarations: [
    CrearRutaComponent,
    MisRutasComponent,
    VerTodasComponent,
    DetalleRutaComponent,
    RutasPublicasComponent,
    HuellaCarbonoComponent,
    CompararTransportesComponent
  ],
  imports: [
    CommonModule,
    RutasRoutingModule,
    ReactiveFormsModule,
    DropdownModule,
    SharedModule,
    CoreModule,
    HttpClientModule,
    DialogModule
]
})
export class RutasModule { }
