import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from 'firebase/auth';
import { Observable } from 'rxjs';

@Component({
  standalone: false,
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.css']
})
export class VerifyEmailComponent implements OnInit {
  errorMessage = '';
  successMessage = '';
  isSending = false;
  user$: Observable<User | null>;

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
    } catch (err: any) {
      this.errorMessage = err.message;
    } finally {
      this.isSending = false;
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
