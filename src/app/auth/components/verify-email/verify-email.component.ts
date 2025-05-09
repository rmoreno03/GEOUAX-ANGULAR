import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from 'firebase/auth';
import { Observable, Subscription, interval } from 'rxjs';
import { take, tap, switchMap } from 'rxjs/operators';

@Component({
  standalone: false,
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.css']
})
export class VerifyEmailComponent implements OnInit, OnDestroy {
  errorMessage = '';
  successMessage = '';
  isSending = false;
  isChecking = false;
  pollingActive = false;
  user$: Observable<User | null>;
  private checkSubscription?: Subscription;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {
    this.user$ = this.auth.getCurrentUser();
  }

  ngOnInit(): void {
    // Comprobar si el usuario está autenticado
    this.auth.getCurrentUser().subscribe(user => {
      if (!user) {
        this.router.navigate(['/auth/login']);
      } else if (user.emailVerified) {
        // Si el email ya está verificado, redirigir al dashboard
        this.router.navigate(['/puntos']);
      } else {
        // Iniciar comprobación periódica del estado de verificación
        this.startPeriodicCheck();
      }
    });
  }

  ngOnDestroy(): void {
    // Detener la comprobación periódica al destruir el componente
    if (this.checkSubscription) {
      this.checkSubscription.unsubscribe();
    }
  }

  /**
   * Inicia la comprobación periódica del estado de verificación
   */
  startPeriodicCheck(): void {
    this.pollingActive = true;
    this.successMessage = 'Comprobando estado de verificación...';

    // Detener cualquier suscripción previa
    if (this.checkSubscription) {
      this.checkSubscription.unsubscribe();
    }

    // Comprobar cada 10 segundos si el email ha sido verificado
    this.checkSubscription = interval(10000).pipe(
      tap(() => {
        this.isChecking = true;
        this.successMessage = 'Comprobando estado de verificación...';
      }),
      switchMap(() => {
        const user = this.auth.getCurrentUserNow();
        if (!user) return Promise.resolve(false);

        // Recargar el usuario y comprobar el estado
        return user.reload()
          .then(() => user.getIdToken(true))
          .then(() => {
            return this.auth.refreshEmailVerificationStatus();
          })
          .catch(error => {
            console.error('Error al comprobar estado:', error);
            return false;
          });
      }),
      take(30) // Máximo 30 intentos (5 minutos)
    ).subscribe({
      next: (isVerified) => {
        this.isChecking = false;

        if (isVerified) {
          this.successMessage = '¡Tu email ha sido verificado! Redirigiendo...';
          this.pollingActive = false;

          // Detener la comprobación y redirigir
          if (this.checkSubscription) {
            this.checkSubscription.unsubscribe();
          }

          setTimeout(() => {
            this.router.navigate(['/puntos']);
          }, 1500);
        } else {
          this.successMessage = '';
        }
      },
      error: (error) => {
        console.error('Error en la comprobación periódica:', error);
        this.isChecking = false;
        this.pollingActive = false;
        this.errorMessage = 'Error al comprobar el estado de verificación';
      },
      complete: () => {
        this.isChecking = false;
        this.pollingActive = false;
      }
    });
  }

  /**
   * Envía un nuevo enlace de verificación
   */
  async sendVerificationLink() {
    this.errorMessage = '';
    this.successMessage = '';
    this.isSending = true;

    try {
      await this.auth.sendVerificationEmail();
      this.successMessage = 'Se ha enviado un enlace de verificación a tu email. Por favor, revisa tu bandeja de entrada.';

      // Reiniciar la comprobación periódica
      this.startPeriodicCheck();
    } catch (err: any) {
      this.errorMessage = err.message;
    } finally {
      this.isSending = false;
    }
  }

  /**
   * Comprueba manualmente el estado de verificación del email
   */
  async checkVerificationStatus() {
    this.errorMessage = '';
    this.successMessage = '';
    this.isChecking = true;

    try {
      // Forzar la actualización del estado
      const isVerified = await this.auth.refreshEmailVerificationStatus(true);

      if (isVerified) {
        this.successMessage = '¡Tu email ha sido verificado! Redirigiendo...';

        setTimeout(() => {
          this.router.navigate(['/puntos']);
        }, 1500);
      } else {
        this.successMessage = 'Tu email aún no ha sido verificado. Por favor, verifica tu correo o solicita un nuevo enlace.';
      }
    } catch (err: any) {
      this.errorMessage = err.message;
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Muestra instrucciones para encontrar el email
   */
  showEmailHelpInfo(): void {
    this.successMessage = '';
    this.errorMessage = '';

    // Mensaje con instrucciones detalladas
    this.successMessage = `
      Instrucciones para encontrar tu enlace de verificación:

      1. Revisa tu bandeja de entrada para un email con asunto "Verificación de correo electrónico"
      2. Si no lo encuentras, revisa la carpeta de spam o correo no deseado
      3. La dirección remitente será el dominio de la aplicación
      4. Haz clic en el enlace "Verificar correo electrónico" del mensaje

      Si después de revisar no encuentras el correo, puedes solicitar un nuevo enlace.
    `;
  }

  /**
   * Muestra el diálogo de soporte
   */
  showSupportOptions(): void {
    this.successMessage = '';
    this.errorMessage = '';

    this.successMessage = `
      ¿Necesitas ayuda? Contacta con soporte:

      • Email: soporte@tuapp.com
      • Teléfono: +34 123 456 789
      • Chat: Disponible en horario laboral

      Por favor, proporciona tu dirección de correo electrónico al contactar con nosotros.
    `;
  }

  /**
   * Cierra la sesión del usuario
   */
  async logout() {
    try {
      await this.auth.logout();
      this.router.navigate(['/auth/login']);
    } catch (err: any) {
      this.errorMessage = err.message;
    }
  }
}
