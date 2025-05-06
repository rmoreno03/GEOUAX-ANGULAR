import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ContactoComponent } from './pages/contacto/contacto.component';
import { GuiasPdfComponent } from './pages/guias-pdf/guias-pdf.component';
import { InicioComponent } from './pages/inicio/inicio.component';
import { PreguntasFrecuentesComponent } from './pages/preguntas-frecuentes/preguntas-frecuentes.component';
import { TutorialesComponent } from './pages/tutoriales/tutoriales.component';

const routes: Routes = [
  { path: '', component: InicioComponent }, // <-- sin 'ayuda'
  { path: 'tutoriales', component: TutorialesComponent },
  { path: 'faq', component: PreguntasFrecuentesComponent },
  { path: 'contacto', component: ContactoComponent },
  { path: 'guias', component: GuiasPdfComponent }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AyudaRoutingModule { }
