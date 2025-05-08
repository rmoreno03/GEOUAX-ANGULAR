import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router } from '@angular/router';
import { Observable, take, map } from 'rxjs';
import { authState, Auth } from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class NoAuthGuard implements CanActivate, CanActivateChild {
  constructor(
    private auth: Auth,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    return authState(this.auth).pipe(
      take(1),
      map(user => {
        const isNotLoggedIn = !user;
        if (!isNotLoggedIn) {
          // Si el usuario ya está autenticado, verificamos si su email está verificado
          if (user.emailVerified) {
            // Si el email está verificado, redirigimos al dashboard
            this.router.navigate(['/puntos']);
          } else {
            // Si el email no está verificado, redirigimos a la verificación
            this.router.navigate(['/auth/verify-email']);
          }
        }
        return isNotLoggedIn;
      })
    );
  }

  canActivateChild(): Observable<boolean> {
    return this.canActivate();
  }
}
