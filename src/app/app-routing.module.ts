import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FeaturesLayoutComponent } from './features/layout/pages/features-layout/features-layout.component';
import { AuthGuard } from './auth/guards/auth.guard';
import { NoAuthGuard } from './auth/guards/no-auth.guard';
import { AuthLayoutComponent } from './features/layout/pages/auth-layout/auth-layout.component';
import { LandingPageComponent } from './features/layout/components/landing-page/landing-page.component';
import { LandingLayoutComponent } from './features/layout/pages/landing-layout/landing-layout.component';

const routes: Routes = [
  // Ruta para la landing page pública - sin restricciones de acceso
  {
    path: 'landing',
    component: LandingLayoutComponent,
    children: [
      {
        path: '',
        component: LandingPageComponent
      }
    ]
  },

  // Ruta home principal - redirige a landing en lugar de auth/login
  {
    path: '',
    redirectTo: 'landing',
    pathMatch: 'full',
  },

  // Rutas para características protegidas
  {
    path: '',
    component: FeaturesLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'puntos',
        loadChildren: () =>
          import('./features/puntos-localizacion/puntos-localizacion.module').then(
            m => m.PuntosLocalizacionModule
          )
      },
      {
        path: 'rutas',
        loadChildren: () =>
          import('./features/rutas/rutas.module').then(
            m => m.RutasModule
          )
      },
      {
        path: 'usuarios',
        loadChildren: () =>
          import('./features/users/users.module').then(
            m => m.UsersModule
          )
      },
      {
        path: 'admin',
        loadChildren: () =>
          import('./features/admin/admin.module').then(
            m => m.AdminModule
          )
      },
      {
        path: 'estadisticas',
        loadChildren: () =>
          import('./features/estadisticas/estadisticas.module').then(
            m => m.EstadisticasModule
          )
      },
      {
        path: 'logros',
        loadChildren: () =>
          import('./features/logros/logros.module').then(
            m => m.LogrosModule
          )
      },
      {
        path: 'ayuda',
        loadChildren: () =>
          import('./features/ayuda/ayuda.module').then(
            m => m.AyudaModule
          )
      },
      {
        path: 'configuracion',
        loadChildren: () =>
          import('./features/settings/settings.module').then(
            m => m.SettingsModule
          )
      },
      {
        path: 'perfil',
        loadChildren: () =>
          import('./features/perfil/perfil.module').then(
            m => m.PerfilModule
          )
      }
    ]
  },

  // Rutas de autenticación
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

  // Ruta para páginas no encontradas - ahora redirige a landing en lugar de auth/login
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
