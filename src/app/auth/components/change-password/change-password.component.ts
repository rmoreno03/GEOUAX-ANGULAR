import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: false,
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent {
  changePasswordForm: FormGroup;
  errorMessage = '';
  successMessage = '';
  isLoading = false;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    if (newPassword !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  get currentPassword() {
    return this.changePasswordForm.get('currentPassword')!;
  }

  get newPassword() {
    return this.changePasswordForm.get('newPassword')!;
  }

  get confirmPassword() {
    return this.changePasswordForm.get('confirmPassword')!;
  }

  toggleCurrentPassword() {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  toggleNewPassword() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  async onSubmit() {
    if (!this.changePasswordForm.valid) return;

    const { currentPassword, newPassword } = this.changePasswordForm.value;
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;

    try {
      await this.auth.updateUserPassword(currentPassword, newPassword);
      this.successMessage = 'Tu contraseña ha sido actualizada correctamente';
      this.changePasswordForm.reset();

      // Esperar 3 segundos y luego redirigir al perfil o dashboard
      setTimeout(() => {
        this.router.navigate(['/perfil']);
      }, 3000);
    } catch (err: any) {
      this.errorMessage = err.message;
    } finally {
      this.isLoading = false;
    }
  }

  goBack() {
    this.router.navigate(['/perfil']);
  }
}
