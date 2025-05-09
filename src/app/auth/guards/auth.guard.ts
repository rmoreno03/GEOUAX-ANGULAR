import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, map, take, tap } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private auth: AuthService,
    private router: Router,
    private firestore: Firestore
  ) {}

    canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
    ): Observable<boolean> | Promise<boolean> | boolean {
    return this.auth.getCurrentUser().pipe(
      take(1),
      map(user => !!user),
      tap(async (loggedIn) => {
        if (!loggedIn) {
          console.log('Acceso denegado: Usuario no autenticado');
          this.router.navigate(['/auth/login']);
          return false;
        }

        // Si el usuario está autenticado, verificar si su email está verificado
        const user = this.auth.getCurrentUserNow();

        if (user) {
          // Verificar por dos fuentes: Firebase Auth y Firestore
          let emailVerifiedInAuth = user.emailVerified;

          // Si el email no está verificado según Auth, intentar recargar el usuario
          if (!emailVerifiedInAuth) {
            try {
              // Recargar el usuario para obtener el estado más reciente
              await user.reload();
              emailVerifiedInAuth = user.emailVerified;
            } catch (error) {
              console.error('Error al recargar usuario:', error);
            }
          }

          // También verificar en Firestore
          const userId = user.uid;
          const userRef = doc(this.firestore, `usuarios/${userId}`);
          const userDoc = await getDoc(userRef);

          let emailVerifiedInFirestore = false;

          if (userDoc.exists()) {
            emailVerifiedInFirestore = userDoc.data()?.['emailVerified'] || false;
          }

          // Permitir acceso si CUALQUIERA de las dos fuentes indica que está verificado
          const isVerified = emailVerifiedInAuth || emailVerifiedInFirestore;

          console.log('Estado de verificación:', {
            auth: emailVerifiedInAuth,
            firestore: emailVerifiedInFirestore,
            combinado: isVerified
          });

          // Si no está verificado, redirigir a la página de verificación
          if (!isVerified && !state.url.includes('/auth/verify-email') && !state.url.includes('/auth/verify-email-success')) {
            console.log('Acceso denegado: Email no verificado');
            this.router.navigate(['/auth/verify-email']);
            return false;
          }
        }

        return true;
      })
    );
  }
}
