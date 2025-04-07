import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, take, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NoAuthGuard implements CanActivateChild {
  constructor(private authService: AuthService, private router: Router) {}

  canActivateChild(): Observable<boolean | UrlTree> {
    return this.authService.getAuthStatus().pipe(
      take(1),
      map(isLoggedIn => {
        if (isLoggedIn) {
          return this.router.createUrlTree(['/puntos']);
        }
        return true;
      })
    );
  }

}
