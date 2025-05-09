import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { Usuario } from '../../../../models/usuario.model';
import { AuthService } from '../../../../auth/services/auth.service';
import { PerfilService } from '../../services/perfil.service';
import { Timestamp } from 'firebase/firestore';

@Component({
  standalone: false,
  selector: 'app-ajustes-cuenta',
  templateUrl: './ajustes-cuenta.component.html',
  styleUrls: ['./ajustes-cuenta.component.css']
})
export class AjustesCuentaComponent implements OnInit {
  // Datos principales
  usuario: Usuario | null = null;

  // Estados de carga
  cargando = true;
  enviandoVerificacion = false;
  cambioEmailEnProceso = false;
  cambioPasswordEnProceso = false;
  eliminandoCuenta = false;
  error = false;
  mensajeError = '';

  // Formularios
  emailForm: FormGroup;
  passwordForm: FormGroup;
  eliminarForm: FormGroup;

  // Visibilidad de contraseñas
  mostrarPasswordActual = false;
  mostrarOldPassword = false;
  mostrarNewPassword = false;
  mostrarConfirmPassword = false;
  mostrarPasswordEliminar = false;

  // Modales
  mostrarModalEliminar = false;

  // Confirmación
  mostrarConfirmacion = false;
  mensajeConfirmacion = '';
  accionConfirmada: (() => void) | null = null;

  // Popups
  mostrarPopup = false;
  mensajePopup = '';
  tipoPopup: 'exito' | 'eliminado' | 'warning' = 'exito';

  constructor(
    private authService: AuthService,
    private perfilService: PerfilService,
    private fb: FormBuilder,
    private router: Router
  ) {
    // Inicializar formularios
    this.emailForm = this.fb.group({
      newEmail: ['', [Validators.required, Validators.email]],
      currentPassword: ['', [Validators.required]]
    });

    this.passwordForm = this.fb.group({
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });

    this.eliminarForm = this.fb.group({
      passwordConfirm: ['', [Validators.required]],
      confirmText: ['', [Validators.required, this.eliminarValidator]]
    });
  }

  async ngOnInit() {
    try {
      this.cargando = true;
      const uid = this.authService.getUserId();

      if (!uid) {
        // Usuario no autenticado, redirigir a login
        this.router.navigate(['/auth/login']);
        return;
      }

      // Obtener datos del usuario desde Firestore
      this.usuario = await this.perfilService.obtenerPerfil(uid);

    } catch (err) {
      console.error('Error al cargar información de cuenta:', err);
      this.error = true;
      this.mensajeError = 'No se pudo cargar la información de tu cuenta. Por favor, intenta de nuevo.';
    } finally {
      this.cargando = false;
    }
  }

  // CAMBIO DE EMAIL
  async cambiarEmail() {
    if (this.emailForm.invalid) return;

    const newEmail = this.emailForm.get('newEmail')?.value;
    const password = this.emailForm.get('currentPassword')?.value;

    try {
      this.cambioEmailEnProceso = true;

      // Cambiar email en Auth
      await this.authService.updateUserEmail(newEmail, password);

      // Mostrar mensaje y limpiar formulario
      this.mostrarExito('Correo electrónico actualizado correctamente. Por favor, verifica tu nuevo correo.');
      this.emailForm.reset();

      // Redirigir a verificación
      setTimeout(() => {
        this.router.navigate(['/auth/verify-email']);
      }, 2000);

    } catch (err) {
      console.error('Error al cambiar email:', err);
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      this.mostrarExito(errorMsg, 'warning');
    } finally {
      this.cambioEmailEnProceso = false;
    }
  }

  // CAMBIO DE CONTRASEÑA
  async cambiarPassword() {
    if (this.passwordForm.invalid) return;

    const oldPassword = this.passwordForm.get('oldPassword')?.value;
    const newPassword = this.passwordForm.get('newPassword')?.value;

    try {
      this.cambioPasswordEnProceso = true;

      // Cambiar contraseña en Auth
      await this.authService.updateUserPassword(oldPassword, newPassword);

      // Mostrar mensaje y limpiar formulario
      this.mostrarExito('Contraseña actualizada correctamente');
      this.passwordForm.reset();

    } catch (err) {
      console.error('Error al cambiar contraseña:', err);
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      this.mostrarExito(errorMsg, 'warning');
    } finally {
      this.cambioPasswordEnProceso = false;
    }
  }

  // VERIFICACIÓN DE EMAIL
  async enviarEmailVerificacion() {
    try {
      this.enviandoVerificacion = true;

      await this.authService.sendVerificationEmail();

      this.mostrarExito('Correo de verificación enviado. Revisa tu bandeja de entrada.');
    } catch (err) {
      console.error('Error al enviar verificación:', err);
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      this.mostrarExito(errorMsg, 'warning');
    } finally {
      this.enviandoVerificacion = false;
    }
  }

  // ELIMINACIÓN DE CUENTA
  mostrarConfirmacionEliminar() {
    this.mostrarModalEliminar = true;
    this.eliminarForm.reset();
  }

  cerrarModalEliminar() {
    this.mostrarModalEliminar = false;
  }

  async eliminarCuenta() {
    if (this.eliminarForm.invalid) return;

    const password = this.eliminarForm.get('passwordConfirm')?.value;

    try {
      this.eliminandoCuenta = true;

      if (this.usuario) {
        // Eliminar perfil en Firestore
        await this.perfilService.eliminarPerfil(this.usuario.uid);

        // Eliminar cuenta en Authentication
        await this.authService.deleteUserAccount(password);

        // Mostrar mensaje y redirigir a landing
        this.mostrarExito('Tu cuenta ha sido eliminada correctamente');
        setTimeout(() => {
          this.router.navigate(['/landing']);
        }, 2000);
      }
    } catch (err) {
      console.error('Error al eliminar cuenta:', err);
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      this.mostrarExito(errorMsg, 'warning');
    } finally {
      this.eliminandoCuenta = false;
      this.cerrarModalEliminar();
    }
  }

  // VALIDADORES
  passwordMatchValidator(group: FormGroup) {
    const password = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  eliminarValidator(control: any) {
    return control.value === 'ELIMINAR' ? null : { invalidConfirmText: true };
  }

  // UTILIDADES
  formatFecha(fecha: Timestamp | Date | string | any): string {
    if (!fecha) return '';

    let date: Date;

    if (fecha instanceof Date) {
      date = fecha;
    } else if (typeof fecha === 'string') {
      date = new Date(fecha);
    } else if (fecha.toDate) {
      date = fecha.toDate();
    } else {
      return '';
    }

    return date.toLocaleString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(',', '');
  }

  // GESTIÓN DE POPUPS
  mostrarExito(mensaje: string, tipo: 'exito' | 'eliminado' | 'warning' = 'exito') {
    this.mensajePopup = mensaje;
    this.tipoPopup = tipo;
    this.mostrarPopup = true;
    setTimeout(() => this.mostrarPopup = false, 3000);
  }

  confirmarAccion(mensaje: string, accion: () => void) {
    this.mensajeConfirmacion = mensaje;
    this.accionConfirmada = accion;
    this.mostrarConfirmacion = true;
  }

  onConfirmar() {
    if (this.accionConfirmada) {
      this.accionConfirmada();
      this.accionConfirmada = null;
    }
    this.mostrarConfirmacion = false;
  }

  onCancelar() {
    this.mostrarConfirmacion = false;
    this.accionConfirmada = null;
  }

  async reintentar() {
    this.error = false;
    this.mensajeError = '';
    await this.ngOnInit();
  }
}
