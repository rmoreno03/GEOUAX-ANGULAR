import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  isLoading = false;
  showResetForm = false;

  loginForm: FormGroup;
  resetForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get email() {
    return this.loginForm.get('email')!;
  }

  get password() {
    return this.loginForm.get('password')!;
  }

  get resetEmail() {
    return this.resetForm.get('email')!;
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleResetForm() {
    this.showResetForm = !this.showResetForm;
    this.errorMessage = '';
    this.successMessage = '';

    // Reiniciar el formulario de restablecimiento cuando se muestra
    if (this.showResetForm) {
      this.resetForm.reset();
      // Si hay un email en el formulario de login, cópialo al formulario de reset
      const loginEmail = this.loginForm.get('email')?.value;
      if (loginEmail) {
        this.resetForm.patchValue({ email: loginEmail });
      }
    }
  }

  async onSubmit() {
    if (!this.loginForm.valid) return;

    const { email, password } = this.loginForm.value;
    this.errorMessage = '';
    this.isLoading = true;

    try {
      // Iniciar sesión
      const cred = await this.auth.login(email!, password!);
      const user = cred.user;

      // Forzar actualización del estado de verificación de email
      await this.refreshUserStatus();

      // Verificar el estado de verificación del email después de la actualización
      if (user.emailVerified) {
        this.router.navigate(['/puntos']);
      } else {
        this.router.navigate(['/auth/verify-email']);
      }
    } catch (err: any) {
      this.errorMessage = err.message;
    } finally {
      this.isLoading = false;
    }
  }

  async loginWithGoogle() {
    this.errorMessage = '';
    this.isLoading = true;

    try {
      const cred = await this.auth.loginWithGoogle();
      const user = cred.user;

      // Forzar actualización del estado de verificación
      await this.refreshUserStatus();

      if (user.emailVerified) {
        this.router.navigate(['/puntos']);
      } else {
        this.router.navigate(['/auth/verify-email']);
      }
    } catch (err: any) {
      this.errorMessage = err.message;
    } finally {
      this.isLoading = false;
    }
  }

  // Método para forzar la actualización del estado de verificación
  private async refreshUserStatus(): Promise<void> {
    try {
      // Obtener el usuario actual
      const user = this.auth.getCurrentUserNow();

      if (user) {
        // Recargar el usuario para obtener el estado más reciente
        await user.reload();

        // Forzar actualización del token ID
        await user.getIdToken(true);

        console.log('Estado de verificación después de actualizar:', user.emailVerified);
      }
    } catch (error) {
      console.error('Error al actualizar estado del usuario:', error);
    }
  }

  async onResetPassword() {
    if (!this.resetForm.valid) return;

    const { email } = this.resetForm.value;
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;

    try {
      await this.auth.resetPassword(email!);
      this.successMessage = 'Se ha enviado un correo para restablecer tu contraseña';
      this.resetForm.reset();

      // Después de 3 segundos, ocultar el formulario de restablecimiento
      setTimeout(() => {
        this.showResetForm = false;
      }, 3000);
    } catch (err: any) {
      this.errorMessage = err.message;
    } finally {
      this.isLoading = false;
    }
  }
}
