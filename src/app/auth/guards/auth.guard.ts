import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, take, map } from 'rxjs';
import { authState, Auth } from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private router = inject(Router);
  private auth = inject(Auth);

  canActivate(): Observable<boolean> {
    return authState(this.auth).pipe(
      take(1),
      map(user => {
        const loggedIn = !!user;
        if (!loggedIn) {
          this.router.navigate(['/auth/login']);
        }
        return loggedIn;
      })
    );
  }
}
