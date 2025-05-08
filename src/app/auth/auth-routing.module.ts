import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { VerifyEmailComponent } from './components/verify-email/verify-email.component';
import { VerifyEmailSuccessComponent } from './components/verify-email-success/verify-email-success.component';
import { ChangePasswordComponent } from './components/change-password/change-password.component';
import { AuthGuard } from './guards/auth.guard';
import { NoAuthGuard } from './guards/no-auth.guard';

const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [NoAuthGuard]
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [NoAuthGuard]
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent
  },
  {
    path: 'verify-email',
    component: VerifyEmailComponent,
    canActivate: [AuthGuard] // Solo usuarios autenticados pueden verificar su email
  },
  {
    path: 'verify-email-success',
    component: VerifyEmailSuccessComponent
  },
  {
    path: 'change-password',
    component: ChangePasswordComponent,
    canActivate: [AuthGuard] // Solo usuarios autenticados pueden cambiar su contraseña
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
