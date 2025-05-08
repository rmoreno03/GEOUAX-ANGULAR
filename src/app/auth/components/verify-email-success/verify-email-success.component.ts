import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: false,
  selector: 'app-verify-email-success',
  templateUrl: './verify-email-success.component.html',
  styleUrls: ['./verify-email-success.component.css']
})
export class VerifyEmailSuccessComponent implements OnInit {
  isVerifying = true;
  isSuccess = false;
  errorMessage = '';
  actionCode: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    // Obtener el código de acción de la URL
    this.route.queryParams.subscribe(params => {
      this.actionCode = params['oobCode'];

      if (!this.actionCode) {
        this.isVerifying = false;
        this.errorMessage = 'Enlace de verificación no válido';
        return;
      }

      this.verifyEmailLink();
    });
  }

  async verifyEmailLink() {
    if (!this.actionCode) return;

    try {
      // Primero verificar el código de acción
      const info = await this.auth.checkActionCode(this.actionCode);

      if (info.operation === 'VERIFY_EMAIL') {
        // Aplicar el código de acción
        await this.auth.applyActionCode(this.actionCode);

        this.isSuccess = true;

        // Comprobar si hay un usuario autenticado
        const user = this.auth.getCurrentUserNow();
        if (user) {
          // Recargar el usuario para actualizar el emailVerified
          await user.reload();

          // Esperar 3 segundos y luego redirigir
          setTimeout(() => {
            this.router.navigate(['/puntos']);
          }, 3000);
        } else {
          // Si no hay usuario autenticado, redirigir al login después de 3 segundos
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 3000);
        }
      } else {
        this.errorMessage = 'El enlace de verificación no es válido';
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Error al verificar el correo electrónico';
    } finally {
      this.isVerifying = false;
    }
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }

  goToDashboard() {
    this.router.navigate(['/puntos']);
  }
}
