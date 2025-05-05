import { Component, inject, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { filter, take } from 'rxjs/operators';

@Component({
  standalone: false,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  private auth = inject(Auth);
  private router = inject(Router);

  ngOnInit(): void {
    // Esperamos a que termine la primera navegación
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      take(1)
    ).subscribe(() => {
      const rutaActual = this.router.url;
      const esPublica = rutaActual.startsWith('/landing') || rutaActual.startsWith('/auth');

      authState(this.auth)
        .pipe(take(1))
        .subscribe(user => {
          if (user && rutaActual === '/') {
            this.router.navigate(['/puntos']);
          } else if (!user && !esPublica) {
            this.router.navigate(['/auth/login']);
          }
        });
    });
  }
}
