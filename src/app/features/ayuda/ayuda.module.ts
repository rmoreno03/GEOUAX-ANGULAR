import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AyudaRoutingModule } from './ayuda-routing.module';
import { InicioComponent } from './pages/inicio/inicio.component';
import { TutorialesComponent } from './pages/tutoriales/tutoriales.component';
import { PreguntasFrecuentesComponent } from './pages/preguntas-frecuentes/preguntas-frecuentes.component';
import { ContactoComponent } from './pages/contacto/contacto.component';
import { GuiasPdfComponent } from './pages/guias-pdf/guias-pdf.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    InicioComponent,
    TutorialesComponent,
    PreguntasFrecuentesComponent,
    ContactoComponent,
    GuiasPdfComponent
  ],
  imports: [
    CommonModule,
    AyudaRoutingModule,
    ReactiveFormsModule,
    FormsModule
  ]
})
export class AyudaModule { }
