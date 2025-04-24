import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: false
})
export class AppComponent implements OnInit {
  private auth = inject(Auth);
  private router = inject(Router);

  ngOnInit(): void {
    authState(this.auth)
      .pipe(take(1))
      .subscribe(user => {
        if (user) {
          this.router.navigate(['/puntos']);
        } else {
          this.router.navigate(['/auth/login']);
        }
      });
  }
}
