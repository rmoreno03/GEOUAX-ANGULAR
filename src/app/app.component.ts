import { Component, OnInit } from '@angular/core';
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
  constructor(
    private router: Router,
    private auth: Auth
  ) {}

  ngOnInit(): void {
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
