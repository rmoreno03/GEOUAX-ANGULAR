import { inject, Injectable, Injector } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import { Router } from '@angular/router';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private injector = inject(Injector);
  private auth = inject(Auth);
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);

  constructor(private router: Router) {
    // Ejecutar authState dentro del contexto de inyección
    authState(this.auth).subscribe(user => {
      const loggedIn = !!user;
      this.isLoggedInSubject.next(loggedIn);

      const rutaActual = this.router.url;
      const esPublica = rutaActual.startsWith('/landing') || rutaActual.startsWith('/auth');

      if (!loggedIn && !esPublica) {
        console.warn('⛔ Usuario no autenticado, redirigiendo...');
        this.router.navigate(['/auth/login']);
      } else {
        console.log(loggedIn ? '✅ Usuario autenticado' : '⛔ Usuario no autenticado (pero en ruta pública)');
      }
    });
  }

  login(email: string, password: string): Promise<void> {
    return signInWithEmailAndPassword(this.auth, email, password)
      .then(() => this.isLoggedInSubject.next(true))
      .catch(error => {
        console.error('❌ Error al iniciar sesión:', error);
        throw error;
      });
  }

  register(email: string, password: string): Promise<void> {
    return createUserWithEmailAndPassword(this.auth, email, password)
      .then(() => this.isLoggedInSubject.next(true))
      .catch(error => {
        console.error('❌ Error al registrar usuario:', error);
        throw error;
      });
  }

  logout(): Promise<void> {
    return signOut(this.auth)
      .then(() => {
        this.isLoggedInSubject.next(false);
        this.router.navigate(['/landing']);
      })
      .catch(error => {
        console.error('❌ Error al cerrar sesión:', error);
        throw error;
      });
  }

  isAuthenticated(): boolean {
    return this.isLoggedInSubject.value;
  }

  getAuthStatus() {
    return this.isLoggedInSubject.asObservable();
  }
}
