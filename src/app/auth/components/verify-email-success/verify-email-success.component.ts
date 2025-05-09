import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {
  Firestore,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc
} from '@angular/fire/firestore';

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
    private auth: AuthService,
    private firestore: Firestore
  ) {}

  ngOnInit(): void {
    // Comprobar primero si el usuario ya tiene el email verificado
    this.checkCurrentUserStatus();
  }

  /**
   * Primero verifica si el usuario actual ya tiene el email verificado
   * antes de intentar aplicar el código
   */
  async checkCurrentUserStatus() {
    const user = this.auth.getCurrentUserNow();

    if (user) {
      try {
        // Intentar recargar el usuario para obtener el estado más reciente
        await user.reload();

        if (user.emailVerified) {
          console.log('El email ya está verificado, no es necesario aplicar el código');
          this.isSuccess = true;
          this.errorMessage = '';
          this.isVerifying = false;

          // Actualizar Firestore por si acaso
          await this.updateFirestoreStatus(user.uid);

          setTimeout(() => {
            this.router.navigate(['/puntos']);
          }, 2000);
          return;
        }
      } catch (error) {
        console.error('Error al verificar estado actual:', error);
        // Continuar con el flujo normal si hay error
      }
    }

    // Si llegamos aquí, el usuario no está verificado o no hay usuario
    // Procedemos a obtener el código de acción y verificarlo
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
      console.log('Verificando enlace de email con código:', this.actionCode);

      // Verificar el código de acción antes de aplicarlo
      const info = await this.auth.checkActionCode(this.actionCode);
      console.log('Información del código:', info);

      if (info.operation === 'VERIFY_EMAIL') {
        // Aplicar el código de acción
        await this.auth.applyActionCode(this.actionCode);
        console.log('Código de acción aplicado correctamente');

        // Obtener el usuario actual
        const user = this.auth.getCurrentUserNow();

        if (user) {
          // Recargar el usuario para obtener el estado actualizado
          await user.reload();

          // Forzar actualización del token ID
          await user.getIdToken(true);

          console.log('Usuario recargado. Email verificado:', user.emailVerified);

          // Actualizar en Firestore independientemente del estado en Auth
          await this.updateFirestoreStatus(user.uid);

          // IMPORTANTE: Marcar como éxito y limpiar mensaje de error
          this.isSuccess = true;
          this.errorMessage = '';

          // Esperar un momento y luego redirigir
          setTimeout(() => {
            this.router.navigate(['/puntos']);
          }, 2000);
        } else {
          console.log('No hay usuario autenticado');

          // Intentar obtener el email desde la información del código
          const email = info.data?.email;

          if (email) {
            console.log('Email extraído del código:', email);
            // Actualizar estado en sesión posterior
            localStorage.setItem('pendingEmailVerification', email);
          }

          // IMPORTANTE: Marcar como éxito y limpiar mensaje de error
          this.isSuccess = true;
          this.errorMessage = '';

          // Redirigir al login después de un momento
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 2000);
        }
      } else {
        // Verificar si de todos modos el usuario ya tiene el email verificado
        await this.checkIfAlreadyVerified();
      }
    } catch (error: any) {
      console.error('Error al verificar el correo electrónico:', error);

      // Verificar si el email ya está verificado a pesar del error
      await this.checkIfAlreadyVerified();

      // Si llegamos aquí es porque no está verificado
      if (!this.isSuccess) {
        if (error.code === 'auth/invalid-action-code') {
          this.errorMessage = 'El enlace de verificación es inválido o ya ha sido utilizado. Por favor, inicia sesión para comprobar el estado de verificación.';
        } else {
          this.errorMessage = error.message || 'Error al verificar el correo electrónico';
        }
      }
    } finally {
      if (this.isVerifying) {
        this.isVerifying = false;
      }
    }
  }

  /**
   * Verifica si el usuario ya tiene el email verificado
   * independientemente del estado del código
   */
  async checkIfAlreadyVerified(): Promise<boolean> {
    const user = this.auth.getCurrentUserNow();

    if (user) {
      try {
        // Recargar el usuario para obtener el estado actualizado
        await user.reload();
        await user.getIdToken(true);

        if (user.emailVerified) {
          console.log('El email ya está verificado a pesar del error con el código');
          this.isSuccess = true;
          this.errorMessage = '';

          // Actualizar Firestore
          await this.updateFirestoreStatus(user.uid);

          setTimeout(() => {
            this.router.navigate(['/puntos']);
          }, 2000);

          return true;
        }

        // También verificar en Firestore por si está marcado como verificado allí
        const userRef = doc(this.firestore, `usuarios/${user.uid}`);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists() && docSnap.data()?.['emailVerified'] === true) {
          console.log('El email está marcado como verificado en Firestore');
          this.isSuccess = true;
          this.errorMessage = '';

          setTimeout(() => {
            this.router.navigate(['/puntos']);
          }, 2000);

          return true;
        }
      } catch (error) {
        console.error('Error al verificar el estado actual:', error);
      }
    }

    return false;
  }

  // Actualizar el estado en Firestore independientemente de Auth
  async updateFirestoreStatus(userId: string): Promise<void> {
    try {
      // Verificar si el documento ya existe
      const userRef = doc(this.firestore, `usuarios/${userId}`);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        // Actualizar el documento existente
        await updateDoc(userRef, {
          emailVerified: true,
          estaActivo: true,
          updatedAt: serverTimestamp()
        });
        console.log('Estado actualizado en Firestore');
      } else {
        console.warn('Documento de usuario no encontrado en Firestore');
      }
    } catch (error) {
      console.error('Error al actualizar estado en Firestore:', error);
    }
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }

  goToDashboard() {
    this.router.navigate(['/puntos']);
  }


  closeWindow(): void {
    window.close();

    // Mostrar un mensaje si la ventana no se cierra después de un breve tiempo
    setTimeout(() => {
      // Si después de 300ms la ventana sigue abierta, mostrar un mensaje adicional
      alert('Esta ventana no se pudo cerrar automáticamente. Por favor, ciérrala manualmente. Tu correo ha sido verificado correctamente.');
    }, 300);
  }
}
