import { Injectable } from '@angular/core';
import { CanActivate, Router, CanActivateChild } from '@angular/router';
import { Observable, take, map } from 'rxjs';
import { authState, Auth } from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class EmailVerifiedGuard implements CanActivate, CanActivateChild {
  constructor(
    private auth: Auth,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    return authState(this.auth).pipe(
      take(1),
      map(user => {
        // Verificar que el usuario esté autenticado
        if (!user) {
          console.warn('⛔ Usuario no autenticado, redirigiendo a login');
          this.router.navigate(['/auth/login']);
          return false;
        }

        // Verificar que el email esté verificado
        if (!user.emailVerified) {
          console.warn('⚠️ Email no verificado, redirigiendo a página de verificación');
          this.router.navigate(['/auth/verify-email']);
          return false;
        }

        // Usuario autenticado y email verificado
        return true;
      })
    );
  }

  canActivateChild(): Observable<boolean> {
    return this.canActivate();
  }
}
