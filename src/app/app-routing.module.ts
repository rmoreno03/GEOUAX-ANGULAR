import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FeaturesLayoutComponent } from './features/layout/pages/features-layout/features-layout.component';
import { AuthGuard } from './auth/guards/auth.guard';
import { NoAuthGuard } from './auth/guards/no-auth.guard';
import { AuthLayoutComponent } from './features/layout/pages/auth-layout/auth-layout.component';
import { LandingPageComponent } from './features/layout/components/landing-page/landing-page.component';
import { LandingLayoutComponent } from './features/layout/pages/landing-layout/landing-layout.component';
import { AdminGuard } from './core/guards/admin.guard';

const routes: Routes = [
  {
    path: 'landing',
    component: LandingLayoutComponent,
    children: [
      { path: '', component: LandingPageComponent }
    ]
  },
  {
    path: '',
    redirectTo: 'landing',
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
      },
      {
        path: 'rutas',
        loadChildren: () => import('./features/rutas/rutas.module').then(m => m.RutasModule)
      },
      {
        path: 'usuarios',
        canActivate: [AdminGuard],
        loadChildren: () => import('./features/users/users.module').then(m => m.UsersModule)
      },
      {
        path: 'admin',
        canActivate: [AdminGuard],
        loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule)
      },
      {
        path: 'estadisticas',
        loadChildren: () => import('./features/estadisticas/estadisticas.module').then(m => m.EstadisticasModule)
      },
      {
        path: 'logros',
        loadChildren: () => import('./features/logros/logros.module').then(m => m.LogrosModule)
      },
      {
        path: 'ayuda',
        loadChildren: () => import('./features/ayuda/ayuda.module').then(m => m.AyudaModule)
      },
      {
        path: 'configuracion',
        canActivate: [AdminGuard],
        loadChildren: () => import('./features/settings/settings.module').then(m => m.SettingsModule)
      },
      {
        path: 'perfil',
        loadChildren: () => import('./features/perfil/perfil.module').then(m => m.PerfilModule)
      }
    ]
  },
  {
    path: 'auth',
    component: AuthLayoutComponent,
    canActivateChild: [NoAuthGuard],
    children: [
      { path: '', loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule) }
    ]
  },
  {
    path: '**',
    redirectTo: 'landing'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
