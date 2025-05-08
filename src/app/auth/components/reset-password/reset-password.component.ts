import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: false,
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  oobCode: string | null = null;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService
  ) {
    this.resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Obtener el código de verificación de la URL
    this.route.queryParams.subscribe(params => {
      this.oobCode = params['oobCode'];
      if (!this.oobCode) {
        this.errorMessage = 'Enlace de restablecimiento no válido';
      }
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    if (password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  get password() {
    return this.resetPasswordForm.get('password');
  }

  get confirmPassword() {
    return this.resetPasswordForm.get('confirmPassword');
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async onSubmit() {
    if (!this.resetPasswordForm.valid || !this.oobCode) return;

    const { password } = this.resetPasswordForm.value;
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      await this.auth.confirmResetPassword(this.oobCode, password);
      this.successMessage = 'Tu contraseña ha sido actualizada correctamente';

      // Después de 3 segundos, redirigir al login
      setTimeout(() => {
        this.router.navigate(['/auth/login']);
      }, 3000);
    } catch (err: any) {
      this.errorMessage = err.message;
    } finally {
      this.isLoading = false;
    }
  }
}
