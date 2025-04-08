import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FeaturesLayoutComponent } from './features/layout/pages/features-layout/features-layout.component';
import { AuthGuard } from './auth/guards/auth.guard';
import { NoAuthGuard } from './auth/guards/no-auth.guard';
import { AuthLayoutComponent } from './features/layout/pages/auth-layout/auth-layout.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
  {
    path: '',
    component: FeaturesLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'puntos',
        loadChildren: () => import('./features/puntos-localizacion/puntos-localizacion.module').then(m => m.PuntosLocalizacionModule)
      }
    ]
  },
  {
    path: 'auth',
    component: AuthLayoutComponent,
    canActivateChild: [NoAuthGuard],
    children: [
      {
        path: '',
        loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];



@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
