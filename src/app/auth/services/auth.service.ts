import { Injectable } from '@angular/core';
import { auth } from '../../../app/app.module'; // <- importas el auth manual
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);

  constructor(private router: Router) {
    // Detectar si hay sesión iniciada
    onAuthStateChanged(auth, (user: User | null) => {
      this.isLoggedInSubject.next(!!user);
    });
  }

  login(email: string, password: string): Promise<void> {
    return signInWithEmailAndPassword(auth, email, password)
      .then(() => this.isLoggedInSubject.next(true));
  }

  register(email: string, password: string): Promise<void> {
    return createUserWithEmailAndPassword(auth, email, password)
      .then(() => this.isLoggedInSubject.next(true));
  }

  logout(): Promise<void> {
    return signOut(auth).then(() => {
      this.isLoggedInSubject.next(false);
      this.router.navigate(['/auth/login']);
    });
  }

  isAuthenticated(): boolean {
    return this.isLoggedInSubject.value;
  }

  getAuthStatus() {
    return this.isLoggedInSubject.asObservable();
  }
}
