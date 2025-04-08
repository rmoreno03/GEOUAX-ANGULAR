import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { Observable, take, map } from 'rxjs';
import { authState } from '@angular/fire/auth';
import { auth } from '../../app.module';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): Observable<boolean> {
    return authState(auth).pipe(
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

