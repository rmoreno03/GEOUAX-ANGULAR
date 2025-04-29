import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VerLogrosComponent } from './pages/ver-logros/ver-logros.component';
import { MisRetosComponent } from './pages/mis-retos/mis-retos.component';
import { CrearRetoPersonalizadoComponent } from './pages/crear-reto-personalizado/crear-reto-personalizado.component';
import { ProgresoComponent } from './pages/progreso/progreso.component';
import { RankingUsuariosComponent } from './pages/ranking-usuarios/ranking-usuarios.component';

const routes: Routes = [
  { path: 'ver-logros', component: VerLogrosComponent },
  { path: 'mis-retos', component: MisRetosComponent },
  { path: 'progreso', component: ProgresoComponent },
  { path: 'crear-reto-personalizado', component: CrearRetoPersonalizadoComponent },
  { path: 'ranking-usuarios', component: RankingUsuariosComponent },
  { path: '', redirectTo: 'ver-logros', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LogrosRoutingModule { }
