import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FeaturesLayoutComponent } from './features/layout/features-layout/features-layout.component';
import { AuthGuard } from './auth/guards/auth.guard';
import { NoAuthGuard } from './auth/guards/no-auth.guard';
import { AuthLayoutComponent } from './auth/layout/auth-layout/auth-layout.component';

const routes: Routes = [
  // Redirige a login si entra vacío
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },

  // Rutas protegidas por autenticación
  {
    path: '',
    component: FeaturesLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'puntos',
        loadChildren: () => import('./features/puntos-localizacion/puntos-localizacion.module').then(m => m.PuntosLocalizacionModule)
      },
      // Puedes añadir más rutas protegidas aquí (rutas, usuarios, etc.)
    ]
  },

  // Rutas de autenticación con layout propio y guard para evitar acceso si ya está logueado
  {
    path: 'auth',
    component: AuthLayoutComponent,
    canActivate: [NoAuthGuard],
    children: [
      {
        path: '',
        loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
      }
    ]
  },

  // Cualquier ruta desconocida → redirige a login
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
