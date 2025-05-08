import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, take, map } from 'rxjs';
import { authState, Auth } from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private auth: Auth,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    return authState(this.auth).pipe(
      take(1),
      map(user => {
        const loggedIn = !!user;
        if (!loggedIn) {
          console.warn('⛔ Usuario no autenticado, redirigiendo a login');
          this.router.navigate(['/auth/login']);
        }
        return loggedIn;
      })
    );
  }
}
