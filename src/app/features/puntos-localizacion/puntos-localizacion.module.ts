import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PuntosLocalizacionComponent } from './components/puntos-localizacion/puntos-localizacion.component';
import { PuntosLocalizacionRoutingModule } from './puntos-localizacion-routing.module';
import { CrearPuntoComponent } from './components/crear-punto/crear-punto.component';
import { DetallePuntoComponent } from './components/detalle-punto/detalle-punto.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';
import { MapaPuntosComponent } from './components/mapa-puntos/mapa-puntos.component';
import { SharedModule } from '../../shared/shared.module';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';
import { environment } from '../../../environments/environment';



@NgModule({
  declarations: [
    PuntosLocalizacionComponent,
    CrearPuntoComponent,
    DetallePuntoComponent,
    MapaPuntosComponent,
  ],
  imports: [
    CommonModule,
    PuntosLocalizacionRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    NgbCarouselModule,
    SharedModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireStorageModule

  ]
})
export class PuntosLocalizacionModule { }
