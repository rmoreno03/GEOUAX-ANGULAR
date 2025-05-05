import { Injectable } from '@angular/core';
import { CanActivateChild, Router, UrlTree } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { Observable, take, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NoAuthGuard implements CanActivateChild {
  constructor(
    private auth: Auth,
    private router: Router
  ) {}

  canActivateChild(): Observable<boolean | UrlTree> {
    return authState(this.auth).pipe(
      take(1),
      map(user => {
        if (user) {
          return this.router.createUrlTree(['/puntos']);
        }
        return true;
      })
    );
  }
}
