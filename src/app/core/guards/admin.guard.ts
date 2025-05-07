import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    const user = this.auth.currentUser;

    if (!user) {
      this.router.navigate(['/landing']);
      return from([false]);
    }

    const userRef = doc(this.firestore, `usuarios/${user.uid}`);
    return from(getDoc(userRef)).pipe(
      map(snap => {
        const data = snap.data();
        if (data?.['rol'] === 'admin') {
          return true;
        } else {
          this.router.navigate(['/landing']);
          return false;
        }
      })
    );
  }
}
