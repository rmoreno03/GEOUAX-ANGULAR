import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { BehaviorSubject } from 'rxjs';
import { auth } from '../../../app/app.module'; // Asegúrate de que aquí importas tu instancia correctamente

@Injectable({ providedIn: 'root' })
export class AuthService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);

  constructor(private router: Router) {
    // Detectar automáticamente si hay sesión activa
    onAuthStateChanged(auth, (user: User | null) => {
      const loggedIn = !!user;
      this.isLoggedInSubject.next(loggedIn);
      console.log(loggedIn ? '✅ Usuario autenticado' : '⛔ Usuario no autenticado');
    });
  }

  /**
   * Inicia sesión con email y contraseña
   */
  login(email: string, password: string): Promise<void> {
    return signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        this.isLoggedInSubject.next(true);
        console.log('🔓 Login exitoso');
      })
      .catch((error) => {
        console.error('❌ Error al iniciar sesión:', error);
        throw error;
      });
  }

  /**
   * Registra un nuevo usuario con email y contraseña
   */
  register(email: string, password: string): Promise<void> {
    return createUserWithEmailAndPassword(auth, email, password)
      .then(() => {
        this.isLoggedInSubject.next(true);
        console.log('🆕 Usuario registrado y logueado');
      })
      .catch((error) => {
        console.error('❌ Error al registrar usuario:', error);
        throw error;
      });
  }

  /**
   * Cierra sesión y redirige al login
   */
  logout(): Promise<void> {
    return signOut(auth)
      .then(() => {
        this.isLoggedInSubject.next(false);
        this.router.navigate(['/auth/login']);
        console.log('🔒 Sesión cerrada');
      })
      .catch((error) => {
        console.error('❌ Error al cerrar sesión:', error);
        throw error;
      });
  }

  /**
   * Retorna si el usuario está autenticado (sincrónico)
   */
  isAuthenticated(): boolean {
    return this.isLoggedInSubject.value;
  }

  /**
   * Devuelve un observable del estado de autenticación
   */
  getAuthStatus() {
    return this.isLoggedInSubject.asObservable();
  }
}
