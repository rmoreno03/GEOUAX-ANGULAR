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
