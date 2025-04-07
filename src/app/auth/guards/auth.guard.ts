import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    const isLogged = this.auth.isAuthenticated();
    if (!isLogged) {
      this.router.navigate(['/auth/login']);
    }
    return isLogged;
  }
}
