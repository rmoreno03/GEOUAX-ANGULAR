import { inject, Injectable, Injector } from '@angular/core';
import {
  Auth,
  authState,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  confirmPasswordReset,
  ActionCodeSettings,
  UserCredential,
  sendEmailVerification,
  applyActionCode,
  checkActionCode,
  verifyPasswordResetCode,
  fetchSignInMethodsForEmail,
  EmailAuthProvider,
  updateEmail,
  reauthenticateWithCredential,
  updatePassword
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  updateProfile,
  User,
  getAdditionalUserInfo,
  deleteUser
} from 'firebase/auth';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError} from 'rxjs/operators';
import {
  Firestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  Timestamp,
  FieldValue
} from '@angular/fire/firestore';
import { AuditLogService } from '../../core/services/audit-log.service';
import { Usuario } from '../../models/usuario.model';

// Interfaz para el usuario en Firestore (ahora se llama Usuario)


// Modelo para el historial de inicios de sesión
export interface LoginAttempt {
  userId: string;
  timestamp: Timestamp | FieldValue; // Timestamp
  success: boolean;
  ipAddress?: string;
  deviceInfo?: string;
  browser?: string;
  method: 'email' | 'google' | 'phone' | 'other';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private injector = inject(Injector);
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  private userSubject = new BehaviorSubject<User | null>(null);
  private userProfileSubject = new BehaviorSubject<Usuario | null>(null);

  // Configuración para redirección después de acciones de correo
  private actionCodeSettings: ActionCodeSettings = {
    url: window.location.origin + '/auth/verify-email-success',
    handleCodeInApp: true
  };

  // Configuración para redirección después de recuperación de contraseña
  private passwordResetSettings: ActionCodeSettings = {
    url: window.location.origin + '/auth/reset-password-confirm',
    handleCodeInApp: true
  };

  // Configuración de seguridad
  private maxFailedAttempts = 5;
  private lockoutDuration = 15 * 60 * 1000; // 15 minutos en milisegundos
  private failedLoginAttempts: Record<string, { count: number, timestamp: number }> = {};

  constructor(
    private router: Router,
    private auditLog: AuditLogService // NUEVO: Inyectar servicio de logs
  ) {
    // Observar cambios en el estado de autenticación
    authState(this.auth).pipe(
      tap(user => {
        this.userSubject.next(user);
        const loggedIn = !!user;
        this.isLoggedInSubject.next(loggedIn);

        if (user) {
          this.updateUserLastLogin(user.uid);
          this.fetchUserProfile(user.uid);
        }
      }),
      catchError(error => {
        console.error('❌ Error observando el estado de autenticación:', error);

        // NUEVO: Log de error
        this.auditLog.logError('Error observando estado de autenticación', error, 'authState');

        return of(null);
      })
    ).subscribe(user => {
      const rutaActual = this.router.url;
      const esPublica = rutaActual.startsWith('/landing') ||
                        rutaActual.startsWith('/auth') ||
                        rutaActual.includes('verify-email') ||
                        rutaActual.includes('email-verified');

      if (user) {
        console.log('✅ Usuario autenticado:', user?.email);

        // Si el usuario no ha verificado su email y la ruta no es pública
        if (!user?.emailVerified && !esPublica && !rutaActual.includes('verify-email')) {
          console.warn('⚠️ Email no verificado, redirigiendo...');
          this.router.navigate(['/auth/verify-email']);
        }
      } else if (!esPublica) {
        console.warn('⛔ Usuario no autenticado, redirigiendo...');
        this.router.navigate(['/auth/login']);
      } else {
        console.log('⛔ Usuario no autenticado (pero en ruta pública)');
      }
    });
  }

  // MÉTODOS DE INICIO DE SESIÓN Y REGISTRO

  /**
   * Inicia sesión con email y contraseña
   */
  async login(email: string, password: string): Promise<UserCredential> {
    try {
      // Verificar si la cuenta está bloqueada por intentos fallidos
      if (this.isAccountLocked(email)) {
        throw new Error('Cuenta temporalmente bloqueada por intentos fallidos. Inténtalo de nuevo más tarde o restablece tu contraseña.');
      }

      const result = await signInWithEmailAndPassword(this.auth, email, password);
      this.isLoggedInSubject.next(true);

      // Registrar inicio de sesión exitoso
      await this.logLoginAttempt(result.user.uid, true, 'email');

      // NUEVO: Log de inicio de sesión exitoso
      await this.auditLog.logInicioSesion();

      // Actualizar fecha de último login en Firestore
      await this.updateUserLastLogin(result.user.uid);

      // Resetear contador de intentos fallidos
      this.resetFailedAttempts(email);

      // Si el email no está verificado, redirigir a la página de verificación
      if (!result.user.emailVerified) {
        this.router.navigate(['/auth/verify-email']);
      }

      return result;
    } catch (error) {
      // Incrementar contador de intentos fallidos
      this.incrementFailedAttempts(email);

      // Registrar intento fallido
      await this.logLoginAttempt('unknown', false, 'email');

      // Log de intento fallido de inicio de sesión
      await this.auditLog.log(
        'Intento fallido de inicio de sesión',
        'warning',
        { email, error: (error instanceof Error ? error.toString() : String(error)) },
        undefined,
        'sesion'
      );

      console.error('❌ Error al iniciar sesión:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Registra un nuevo usuario con email y contraseña
   */
  async register(email: string, password: string, displayName?: string): Promise<UserCredential> {
    try {
      // Verificar si el email ya existe
      const methods = await fetchSignInMethodsForEmail(this.auth, email);
      if (methods && methods.length > 0) {
        throw new Error('Este correo electrónico ya está registrado. Por favor, utiliza otro o recupera tu contraseña.');
      }

      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      this.isLoggedInSubject.next(true);

      // Si se proporciona un nombre, actualizar el perfil
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }

      // Crear el perfil en Firestore
      await this.createUserProfile(
        userCredential.user,
        displayName,
        userCredential.user.emailVerified
      );

      // Enviar email de verificación
      await this.sendVerificationEmail(userCredential.user);

      // Registrar la creación de cuenta
      await this.logLoginAttempt(userCredential.user.uid, true, 'email');

      // NUEVO: Log de registro exitoso
      await this.auditLog.log(
        'Usuario registrado',
        'success',
        { email, displayName },
        userCredential.user.uid,
        'usuario'
      );

      // Redirigir a la página de verificación
      this.router.navigate(['/auth/verify-email']);

      return userCredential;
    } catch (error) {
      console.error('❌ Error al registrar usuario:', error);

      // NUEVO: Log de error de registro
      await this.auditLog.logError('Error al registrar usuario', error, 'register');

      throw this.handleAuthError(error);
    }
  }

  /**
   * Inicia sesión con Google
   */
  async loginWithGoogle(): Promise<UserCredential> {
    try {
      const provider = new GoogleAuthProvider();
      // Añadir scopes adicionales para obtener más información del usuario
      provider.addScope('profile');
      provider.addScope('email');

      const result = await signInWithPopup(this.auth, provider);
      this.isLoggedInSubject.next(true);

      // Obtener información adicional del usuario
      const additionalInfo = getAdditionalUserInfo(result);

      // Si es la primera vez que el usuario se registra con Google
      if (additionalInfo?.isNewUser) {
        // Los usuarios de Google ya tienen el email verificado
        await this.createUserProfile(result.user, result.user.displayName ?? undefined, true);

        // NUEVO: Log de nuevo registro con Google
        await this.auditLog.log(
          'Nuevo usuario registrado con Google',
          'success',
          { email: result.user.email },
          result.user.uid,
          'usuario'
        );
      } else {
        // Actualizar fecha de último login
        await this.updateUserLastLogin(result.user.uid);
      }

      // Registrar inicio de sesión exitoso
      await this.logLoginAttempt(result.user.uid, true, 'google');

      // NUEVO: Log de inicio de sesión con Google
      await this.auditLog.log(
        'Inicio de sesión con Google',
        'success',
        { email: result.user.email },
        result.user.uid,
        'sesion'
      );

      return result;
    } catch (error) {
      console.error('❌ Error al iniciar sesión con Google:', error);

      // Registrar intento fallido
      await this.logLoginAttempt('unknown', false, 'google');

      // NUEVO: Log de error de inicio de sesión con Google
      await this.auditLog.logError('Error al iniciar sesión con Google', error, 'loginWithGoogle');

      throw this.handleAuthError(error);
    }
  }

  /**
   * Cierra la sesión del usuario actual
   */
  async logout(): Promise<void> {
    try {
      // Registrar evento de cierre de sesión
      const userId = this.getUserId();
      if (userId) {
        await this.logLoginAttempt(userId, true, 'other');
      }

      // NUEVO: Log de cierre de sesión
      await this.auditLog.logCierreSesion();

      await signOut(this.auth);
      this.isLoggedInSubject.next(false);
      this.userSubject.next(null);
      this.userProfileSubject.next(null);
      this.router.navigate(['/landing']);
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);

      // NUEVO: Log de error al cerrar sesión
      await this.auditLog.logError('Error al cerrar sesión', error, 'logout');

      throw this.handleAuthError(error);
    }
  }

  // MÉTODOS DE VERIFICACIÓN DE EMAIL

  /**
   * Envía un correo de verificación al usuario actual
   */
  async sendVerificationEmail(user?: User): Promise<void> {
    try {
      const currentUser = user || this.auth.currentUser;

      if (!currentUser) {
        throw new Error('No hay usuario autenticado');
      }

      // Enviar email usando Firebase Auth
      await sendEmailVerification(currentUser, this.actionCodeSettings);

      // NUEVO: Log de envío de correo de verificación
      await this.auditLog.log(
        'Correo de verificación enviado',
        'info',
        { email: currentUser.email },
        currentUser.uid,
        'usuario'
      );

      console.log('✅ Correo de verificación enviado a:', currentUser.email);
    } catch (error) {
      console.error('❌ Error al enviar correo de verificación:', error);

      // NUEVO: Log de error de envío de correo de verificación
      await this.auditLog.logError('Error al enviar correo de verificación', error, 'sendVerificationEmail');

      throw this.handleAuthError(error);
    }
  }

  /**
   * Verifica un código de acción
   * @param oobCode Código de acción recibido por correo
   */
  async checkActionCode(oobCode: string): Promise<any> {
    try {
      return await checkActionCode(this.auth, oobCode);
    } catch (error) {
      console.error('❌ Error al verificar código de acción:', error);

      // NUEVO: Log de error al verificar código
      await this.auditLog.logError('Error al verificar código de acción', error, 'checkActionCode');

      throw this.handleAuthError(error);
    }
  }

  /**
   * Aplica un código de acción
   * @param oobCode Código de acción recibido por correo
   */
  async applyActionCode(oobCode: string): Promise<void> {
    try {
      console.log('Aplicando código de acción:', oobCode);

      // Aplicar el código de acción de Firebase
      await applyActionCode(this.auth, oobCode);
      console.log('Código aplicado correctamente');

      // Recargar el usuario para actualizar su estado de verificación
      const user = this.auth.currentUser;
      if (user) {
        try {
          // IMPORTANTE: Esperar a que se recargue el usuario
          await user.reload();

          // IMPORTANTE: También forzar la actualización del token ID
          await user.getIdToken(true);

          console.log('Usuario recargado, emailVerified:', user.emailVerified);

          // Actualizar el subject
          this.userSubject.next(user);

          // Actualizar también el perfil en Firestore SIEMPRE
          const userRef = doc(this.firestore, `usuarios/${user.uid}`);

          // Actualizamos Firestore independientemente del valor en Auth
          await updateDoc(userRef, {
            emailVerified: true,
            estaActivo: true,
            updatedAt: serverTimestamp()
          });

          console.log('Perfil en Firestore actualizado: emailVerified=true');

          // NUEVO: Log de verificación de email exitosa
          await this.auditLog.log(
            'Email verificado exitosamente',
            'success',
            { email: user.email },
            user.uid,
            'usuario'
          );

          // Actualizar el userProfile
          const currentProfile = this.userProfileSubject.value;
          if (currentProfile) {
            this.userProfileSubject.next({
              ...currentProfile,
              emailVerified: true,
              estaActivo: true
            });
          }
        } catch (reloadError) {
          console.error('Error al recargar usuario:', reloadError);

          // NUEVO: Log de error al recargar usuario
          await this.auditLog.logError('Error al recargar usuario después de verificar email', reloadError, 'applyActionCode');

          // Si hay error al recargar, intentar actualizar Firestore de todos modos
          try {
            const userRef = doc(this.firestore, `usuarios/${user.uid}`);
            await updateDoc(userRef, {
              emailVerified: true,
              estaActivo: true,
              updatedAt: serverTimestamp()
            });
            console.log('Perfil en Firestore actualizado a pesar del error de recarga');
          } catch (firestoreError) {
            console.error('Error al actualizar Firestore:', firestoreError);

            // NUEVO: Log de error al actualizar Firestore
            await this.auditLog.logError('Error al actualizar Firestore después de verificar email', firestoreError, 'applyActionCode');
          }
        }
      } else {
        console.warn('No hay usuario autenticado al aplicar el código de verificación');
      }
    } catch (error) {
      console.error('❌ Error al aplicar código de acción:', error);

      // NUEVO: Log de error al aplicar código de acción
      await this.auditLog.logError('Error al aplicar código de acción', error, 'applyActionCode');

      throw this.handleAuthError(error);
    }
  }



  // MÉTODOS DE RESTABLECIMIENTO DE CONTRASEÑA

  /**
   * Envía un correo de restablecimiento de contraseña
   * @param email Correo electrónico del usuario
   */
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email, this.passwordResetSettings);
      console.log('✅ Correo de restablecimiento enviado a:', email);

      // NUEVO: Log de solicitud de restablecimiento de contraseña
      await this.auditLog.log(
        'Solicitud de restablecimiento de contraseña',
        'info',
        { email },
        undefined,
        'usuario'
      );

      // Resetear contador de intentos fallidos si existe
      this.resetFailedAttempts(email);
    } catch (error) {
      console.error('❌ Error al enviar correo de restablecimiento:', error);

      // NUEVO: Log de error al enviar correo de restablecimiento
      await this.auditLog.logError('Error al enviar correo de restablecimiento', error, 'resetPassword');

      throw this.handleAuthError(error);
    }
  }

  getCurrentUserNow(): User | null {
    return this.auth.currentUser;
  }

  /**
   * Confirma el restablecimiento de contraseña con el código recibido
   * @param oobCode Código de verificación recibido por correo
   * @param newPassword Nueva contraseña
   */
  async confirmResetPassword(oobCode: string, newPassword: string): Promise<void> {
    try {
      // Verificar primero el código para asegurarse de que es válido
      const email = await verifyPasswordResetCode(this.auth, oobCode);

      if (!email) {
        throw new Error('El código de verificación no es válido');
      }

      await confirmPasswordReset(this.auth, oobCode, newPassword);
      console.log('✅ Contraseña restablecida correctamente');

      // NUEVO: Log de contraseña restablecida
      await this.auditLog.log(
        'Contraseña restablecida',
        'success',
        { email },
        undefined,
        'usuario'
      );

      // Resetear contador de intentos fallidos
      this.resetFailedAttempts(email);
    } catch (error) {
      console.error('❌ Error al restablecer contraseña:', error);

      // NUEVO: Log de error al restablecer contraseña
      await this.auditLog.logError('Error al restablecer contraseña', error, 'confirmResetPassword');

      throw this.handleAuthError(error);
    }
  }

  // MÉTODOS DE GESTIÓN DE PERFIL

  /**
   * Actualiza el perfil del usuario
   * @param updates Objeto con los campos a actualizar (displayName, photoURL)
   */
  async updateUserProfile(updates: { displayName?: string, photoURL?: string }): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('No hay usuario autenticado');
    }

    try {
      // Actualizar perfil en Firebase Auth
      await updateProfile(user, updates);

      // Actualizar perfil en Firestore
      const userRef = doc(this.firestore, `usuarios/${user.uid}`);
      const firestoreUpdates: any = {};

      if (updates.displayName) firestoreUpdates.nombre = updates.displayName;
      if (updates.photoURL) firestoreUpdates.fotoUrl = updates.photoURL;
      firestoreUpdates.updatedAt = serverTimestamp();

      await updateDoc(userRef, firestoreUpdates);

      // NUEVO: Log de actualización de perfil
      const cambios = Object.keys(firestoreUpdates).filter(k => k !== 'updatedAt');
      await this.auditLog.logPerfilActualizado(user.uid, cambios);

      // Actualizar el subject
      this.userSubject.next(user);

      // Actualizar el perfil extendido en el subject
      const currentProfile = this.userProfileSubject.value;
      if (currentProfile) {
        this.userProfileSubject.next({
          ...currentProfile,
          nombre: updates.displayName || currentProfile.nombre,
          fotoUrl: updates.photoURL || currentProfile.fotoUrl
        });
      }

      console.log('✅ Perfil actualizado correctamente');
    } catch (error) {
      console.error('❌ Error al actualizar perfil:', error);

      // NUEVO: Log de error al actualizar perfil
      await this.auditLog.logError('Error al actualizar perfil', error, 'updateUserProfile');

      throw this.handleAuthError(error);
    }
  }

  /**
   * Actualiza el email del usuario
   * @param newEmail Nuevo correo electrónico
   * @param password Contraseña actual para reautenticar
   */
  async updateUserEmail(newEmail: string, password: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('No hay usuario autenticado');
    }

    if (!user.email) {
      throw new Error('El usuario no tiene un correo electrónico asociado');
    }

    try {
      // Re-autenticar al usuario
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      // NUEVO: Log de cambio de email
      await this.auditLog.log(
        'Cambio de correo electrónico',
        'warning',
        { oldEmail: user.email, newEmail },
        user.uid,
        'usuario'
      );

      // Actualizar el email
      await updateEmail(user, newEmail);

      // Actualizar el email y estado de verificación en Firestore
      const userRef = doc(this.firestore, `usuarios/${user.uid}`);
      await updateDoc(userRef, {
        email: newEmail,
        emailVerified: false,
        estaActivo: false,
        updatedAt: serverTimestamp()
      });

      // Enviar correo de verificación para el nuevo email
      await this.sendVerificationEmail();

      // Actualizar el perfil en el subject
      const currentProfile = this.userProfileSubject.value;
      if (currentProfile) {
        this.userProfileSubject.next({
          ...currentProfile,
          email: newEmail,
          emailVerified: false,
          estaActivo: false
        });
      }

      // Mostrar mensaje y redirigir a verificación
      console.log('✅ Email actualizado correctamente. Se requiere verificación.');
      this.router.navigate(['/auth/verify-email']);
    } catch (error) {
      console.error('❌ Error al actualizar email:', error);

      // NUEVO: Log de error al actualizar email
      await this.auditLog.logError('Error al actualizar email', error, 'updateUserEmail');

      throw this.handleAuthError(error);
    }
  }

  /**
   * Actualiza la contraseña del usuario
   * @param currentPassword Contraseña actual
   * @param newPassword Nueva contraseña
   */
  async updateUserPassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('No hay usuario autenticado');
    }

    if (!user.email) {
      throw new Error('El usuario no tiene un correo electrónico asociado');
    }

    try {
      // Re-autenticar al usuario
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Actualizar la contraseña
      await updatePassword(user, newPassword);

      // Registrar el cambio de contraseña en Firestore
      const userRef = doc(this.firestore, `usuarios/${user.uid}`);
      await updateDoc(userRef, {
        passwordUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // NUEVO: Log de cambio de contraseña
      await this.auditLog.logCambioPassword(user.uid);

      console.log('✅ Contraseña actualizada correctamente');
    } catch (error) {
      console.error('❌ Error al actualizar contraseña:', error);

      // NUEVO: Log de error al actualizar contraseña
      await this.auditLog.logError('Error al actualizar contraseña', error, 'updateUserPassword');

      throw this.handleAuthError(error);
    }
  }

  // MÉTODOS DE ESTADO DE AUTENTICACIÓN

  isAuthenticated(): boolean {
    return this.isLoggedInSubject.value;
  }

  getAuthStatus(): Observable<boolean> {
    return this.isLoggedInSubject.asObservable();
  }

  getCurrentUser(): Observable<User | null> {
    return this.userSubject.asObservable();
  }

  getUserProfile(): Observable<Usuario | null> {
    return this.userProfileSubject.asObservable();
  }

  getUserId(): string | null {
    return this.auth.currentUser?.uid || null;
  }

  getUserEmail(): string | null {
    return this.auth.currentUser?.email || null;
  }

  isEmailVerified(): boolean {
    return this.auth.currentUser?.emailVerified || false;
  }

  // MÉTODOS PRIVADOS Y AUXILIARES

  /**
   * Crea el perfil de usuario en Firestore
   */
  private async createUserProfile(
    user: User,
    displayName?: string,
    emailVerified = false
  ): Promise<void> {
    const userProfile: Usuario = {
      uid: user.uid,
      email: user.email || '',
      nombre: displayName || user.displayName || '',
      fotoUrl: user.photoURL || '',
      emailVerified: emailVerified || user.emailVerified,
      estaActivo: emailVerified || false,
      phoneNumber: user.phoneNumber || '',
      fechaRegistro: serverTimestamp(),
      fechaUltimoLogin: serverTimestamp(),
      rol: 'usuario' // Rol predeterminado
    };

    try {
      const userRef = doc(this.firestore, `usuarios/${user.uid}`);
      await setDoc(userRef, userProfile);

      this.userProfileSubject.next(userProfile);
      console.log('✅ Perfil de usuario creado correctamente');

      // NUEVO: Log de creación de perfil
      await this.auditLog.log(
        'Perfil de usuario creado',
        'success',
        { email: user.email, displayName },
        user.uid,
        'usuario'
      );
    } catch (error) {
      console.error('❌ Error al crear perfil de usuario:', error);

      // NUEVO: Log de error al crear perfil
      await this.auditLog.logError('Error al crear perfil de usuario', error, 'createUserProfile');

      throw error;
    }
  }

  /**
   * Actualiza la fecha del último inicio de sesión
   * Si el documento no existe, crea un perfil básico
   */
  private async updateUserLastLogin(userId: string): Promise<void> {
    try {
      const userRef = doc(this.firestore, `usuarios/${userId}`);

      // Verificar si el documento existe
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        // El documento existe, actualizar la fecha de último login
        await updateDoc(userRef, {
          fechaUltimoLogin: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        console.log('✅ Fecha de último inicio de sesión actualizada');
      } else {
        // El documento no existe, crearlo con información básica
        const user = this.auth.currentUser;

        if (user) {
          // Crear un perfil básico para el usuario
          await this.createUserProfile(
            user,
            user.displayName || undefined,
            user.emailVerified
          );
        } else {
          console.warn('⚠️ No se pudo crear el perfil de usuario - usuario no disponible');
        }
      }
    } catch (error) {
      console.error('❌ Error al actualizar fecha de último inicio de sesión:', error);

      // NUEVO: Log de error al actualizar fecha de último inicio de sesión
      await this.auditLog.logError('Error al actualizar fecha de último inicio de sesión', error, 'updateUserLastLogin');

      // No lanzar el error para evitar que interrumpa el flujo de autenticación
    }
  }

  /**
   * Obtiene el perfil del usuario desde Firestore
   */
  private async fetchUserProfile(userId: string): Promise<void> {
    try {
      const userRef = doc(this.firestore, `usuarios/${userId}`);

      // Usar onSnapshot para obtener actualizaciones en tiempo real
      const unsubscribe = onSnapshot(userRef,
        (doc) => {
          if (doc.exists()) {
            const profile = doc.data() as Usuario;
            this.userProfileSubject.next(profile);
          } else {
            // Si no existe el perfil pero sí el usuario, crearlo
            const user = this.auth.currentUser;
            if (user) {
              this.createUserProfile(user, undefined, user.emailVerified);
            }
          }
        },
        (error) => {
          console.error('❌ Error al observar perfil de usuario:', error);

          // NUEVO: Log de error al observar perfil
          this.auditLog.logError('Error al observar perfil de usuario', error, 'fetchUserProfile');
        }
      );

      // Para limpiar el observable cuando sea necesario, guardar unsubscribe en una variable o añadirlo a un array
    } catch (error) {
      console.error('❌ Error al obtener perfil de usuario:', error);

      // NUEVO: Log de error al obtener perfil
      await this.auditLog.logError('Error al obtener perfil de usuario', error, 'fetchUserProfile');
    }
  }

  /**
   * Registra un intento de inicio de sesión
   */
  private async logLoginAttempt(
    userId: string,
    success: boolean,
    method: 'email' | 'google' | 'phone' | 'other'
  ): Promise<void> {
    try {
      // Información del dispositivo y navegador
      const deviceInfo = navigator.userAgent;
      const browser = this.getBrowserInfo();

      const attempt: LoginAttempt = {
        userId,
        timestamp: serverTimestamp(),
        success,
        deviceInfo,
        browser,
        method
      };

      // Guardar en Firestore
      const loginAttemptsRef = collection(this.firestore, 'loginAttempts');
      await addDoc(loginAttemptsRef, attempt);
    } catch (error) {
      // Registramos el error pero no lo propagamos para evitar bloquear el flujo principal
      console.error('❌ Error al registrar intento de inicio de sesión:', error);

      // NUEVO: Log de error al registrar intento de inicio de sesión
      await this.auditLog.logError('Error al registrar intento de inicio de sesión', error, 'logLoginAttempt');
    }
  }

  /**
   * Obtiene el perfil del usuario actual directamente (no como observable)
   * @returns El perfil del usuario o null si no existe
   */
  async getUserProfileSnapshot(): Promise<Usuario | null> {
    const userId = this.getUserId();
    if (!userId) return null;

    try {
      const userRef = doc(this.firestore, `usuarios/${userId}`);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        return userDoc.data() as Usuario;
      }
      return null;
    } catch (error) {
      console.error('❌ Error al obtener perfil de usuario:', error);

      // NUEVO: Log de error al obtener perfil snapshot
      await this.auditLog.logError('Error al obtener perfil de usuario snapshot', error, 'getUserProfileSnapshot');

      return null;
    }
  }

  /**
   * Obtiene información del navegador
   */
  private getBrowserInfo(): string {
    const userAgent = navigator.userAgent;
    let browser = 'Desconocido';

    if (userAgent.match(/chrome|chromium|crios/i)) {
      browser = "Chrome";
    } else if (userAgent.match(/firefox|fxios/i)) {
      browser = "Firefox";
    } else if (userAgent.match(/safari/i)) {
      browser = "Safari";
    } else if (userAgent.match(/opr\//i)) {
      browser = "Opera";
    } else if (userAgent.match(/edg/i)) {
      browser = "Edge";
    }

    return browser;
  }

  // GESTIÓN DE INTENTOS FALLIDOS DE INICIO DE SESIÓN

  private incrementFailedAttempts(email: string): void {
    const now = Date.now();

    if (!this.failedLoginAttempts[email]) {
      this.failedLoginAttempts[email] = { count: 1, timestamp: now };
    } else {
      // Reiniciar contador si ha pasado el tiempo de bloqueo
      if (now - this.failedLoginAttempts[email].timestamp > this.lockoutDuration) {
        this.failedLoginAttempts[email] = { count: 1, timestamp: now };
      } else {
        this.failedLoginAttempts[email].count += 1;
        this.failedLoginAttempts[email].timestamp = now;
      }
    }

    console.warn(`⚠️ Intento fallido para ${email}: ${this.failedLoginAttempts[email].count}/${this.maxFailedAttempts}`);

    // NUEVO: Log de intento fallido
    if (this.failedLoginAttempts[email].count >= 3) {
      this.auditLog.log(
        `Múltiples intentos fallidos de login (${this.failedLoginAttempts[email].count})`,
        'warning',
        { email, intentos: this.failedLoginAttempts[email].count },
        undefined,
        'sesion'
      );
    }
  }

  private resetFailedAttempts(email: string): void {
    if (this.failedLoginAttempts[email]) {
      delete this.failedLoginAttempts[email];
    }
  }

  private isAccountLocked(email: string): boolean {
    const now = Date.now();
    const attempts = this.failedLoginAttempts[email];

    if (!attempts) return false;

    // Si ha pasado el tiempo de bloqueo, reiniciar contador
    if (now - attempts.timestamp > this.lockoutDuration) {
      this.resetFailedAttempts(email);
      return false;
    }

    // Bloquear si se supera el máximo de intentos
    if (attempts.count >= this.maxFailedAttempts) {
      // NUEVO: Log de cuenta bloqueada
      this.auditLog.log(
        'Cuenta bloqueada temporalmente por intentos fallidos',
        'warning',
        { email, intentos: attempts.count },
        undefined,
        'sesion'
      );

      return true;
    }

    return false;
  }

  /**
 * Fuerza la actualización del estado de verificación del email
 * Útil después de que el usuario verifica su correo
 */
async refreshEmailVerificationStatus(forceFirestore = true): Promise<boolean> {
  try {
    const user = this.auth.currentUser;
    if (!user) {
      console.warn('No hay usuario para actualizar estado de verificación');
      return false;
    }

    // Recargar el usuario desde Firebase
    await user.reload();

    // Forzar la actualización del token
    await user.getIdToken(true);

    // Verificar el estado después de recargar
    const isVerified = user.emailVerified;
    console.log('Estado de verificación después de reload:', isVerified);

    // Actualizar el subject
    this.userSubject.next(user);

    // Si está verificado o se fuerza la actualización, actualizar también en Firestore
    if (isVerified || forceFirestore) {
      const userRef = doc(this.firestore, `usuarios/${user.uid}`);
      await updateDoc(userRef, {
        emailVerified: true,
        estaActivo: true,
        updatedAt: serverTimestamp()
      });

      console.log('Firestore actualizado con emailVerified=true');

      // NUEVO: Log de email verificado
      if (isVerified) {
        await this.auditLog.log(
          'Email verificado (actualización forzada)',
          'success',
          { email: user.email },
          user.uid,
          'usuario'
        );
      }

      // Actualizar el userProfile
      const currentProfile = this.userProfileSubject.value;
      if (currentProfile) {
        this.userProfileSubject.next({
          ...currentProfile,
          emailVerified: true,
          estaActivo: true
        });
      }
    }

    return isVerified;
  } catch (error) {
    console.error('Error al actualizar estado de verificación:', error);

    // NUEVO: Log de error al actualizar estado de verificación
    await this.auditLog.logError('Error al actualizar estado de verificación', error, 'refreshEmailVerificationStatus');

    return false;
  }
}

  /**
   * Inicia un poll para comprobar periódicamente
   * si el email ha sido verificado
   */
  startVerificationPolling(intervalMs = 5000, maxAttempts = 12): Promise<boolean> {
    return new Promise((resolve) => {
      let attempts = 0;

      const checkInterval = setInterval(async () => {
        attempts++;
        console.log(`Verificación ${attempts}/${maxAttempts}...`);

        try {
          // Obtener usuario actual
          const user = this.auth.currentUser;
          if (!user) {
            clearInterval(checkInterval);
            resolve(false);
            return;
          }

          // Recargar usuario
          await user.reload();

          // Si el email está verificado, resolver con éxito
          if (user.emailVerified) {
            clearInterval(checkInterval);

            // Actualizar Firestore
            const userRef = doc(this.firestore, `usuarios/${user.uid}`);
            await updateDoc(userRef, {
              emailVerified: true,
              estaActivo: true,
              updatedAt: serverTimestamp()
            });

            // NUEVO: Log de email verificado (polling)
            await this.auditLog.log(
              'Email verificado (detectado por polling)',
              'success',
              { email: user.email },
              user.uid,
              'usuario'
            );

            // Actualizar el subject
            this.userSubject.next(user);

            resolve(true);
            return;
          }

          // Si se alcanza el número máximo de intentos, resolver con false
          if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            resolve(false);
          }
        } catch (error) {
          console.error('Error en polling de verificación:', error);

          // NUEVO: Log de error en polling
          this.auditLog.logError('Error en polling de verificación', error, 'startVerificationPolling');

          // Continuar con el polling a pesar del error
        }
      }, intervalMs);
    });
  }

  // MANEJO DE ERRORES DE AUTENTICACIÓN

  private handleAuthError(error: any): Error {
      let errorMessage = 'Se produjo un error desconocido';

      // Si el error es ya una instancia de Error, devolverlo directamente
      if (error instanceof Error && !error.hasOwnProperty('code')) {
        return error;
      }

      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'Este correo electrónico ya está registrado';
            break;
          case 'auth/invalid-email':
            errorMessage = 'El formato del correo electrónico no es válido';
            break;
          case 'auth/user-disabled':
            errorMessage = 'Esta cuenta ha sido deshabilitada';
            break;
          case 'auth/user-not-found':
            errorMessage = 'No existe una cuenta con este correo electrónico';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Contraseña incorrecta';
            break;
          case 'auth/weak-password':
            errorMessage = 'La contraseña debe tener al menos 6 caracteres';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Demasiados intentos fallidos. Inténtalo más tarde o restablece tu contraseña.';
            break;
          case 'auth/popup-closed-by-user':
            errorMessage = 'El proceso de autenticación fue cancelado';
            break;
          case 'auth/operation-not-allowed':
            errorMessage = 'Esta operación no está permitida';
            break;
          case 'auth/requires-recent-login':
            errorMessage = 'Esta operación requiere una autenticación reciente. Por favor, inicia sesión nuevamente.';
            break;
          case 'auth/expired-action-code':
            errorMessage = 'El código de acción ha expirado. Por favor, solicita uno nuevo.';
            break;
          case 'auth/invalid-action-code':
            errorMessage = 'El código de acción no es válido. Puede haber sido usado o haber expirado.';
            break;
          case 'auth/account-exists-with-different-credential':
            errorMessage = 'Ya existe una cuenta con este correo electrónico pero con otro método de inicio de sesión.';
            break;
          case 'auth/invalid-credential':
            errorMessage = 'Credenciales inválidas. Por favor, verifica tus datos e inténtalo de nuevo.';
            break;
          case 'auth/captcha-check-failed':
            errorMessage = 'La verificación captcha ha fallado. Por favor, inténtalo de nuevo.';
            break;
          case 'auth/missing-phone-number':
            errorMessage = 'Falta el número de teléfono.';
            break;
          case 'auth/invalid-phone-number':
            errorMessage = 'El formato del número de teléfono no es válido.';
            break;
          case 'auth/quota-exceeded':
            errorMessage = 'Se ha superado la cuota de solicitudes. Inténtalo más tarde.';
            break;
          default:
            errorMessage = error.message || 'Error de autenticación. Por favor, inténtalo de nuevo más tarde.';
        }
      }

      return new Error(errorMessage);
    }

    /**
 * Elimina la cuenta del usuario y su perfil asociado
 * @param password Contraseña actual para reautenticar
 */
  async deleteUserAccount(password: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('No hay usuario autenticado');
    }

    if (!user.email) {
      throw new Error('El usuario no tiene un correo electrónico asociado');
    }

    try {
      // Re-autenticar al usuario
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      // NUEVO: Log de eliminación de cuenta
      await this.auditLog.log(
        'Cuenta de usuario eliminada',
        'warning',
        { email: user.email },
        user.uid,
        'usuario'
      );

      // Eliminar usuario de Auth
      await deleteUser(user);

      console.log('✅ Cuenta eliminada correctamente');
      this.router.navigate(['/landing']);
    } catch (error) {
      console.error('❌ Error al eliminar cuenta:', error);

      // NUEVO: Log de error al eliminar cuenta
      await this.auditLog.logError('Error al eliminar cuenta', error, 'deleteUserAccount');

      throw this.handleAuthError(error);
    }
  }
}
