import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './app.module';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: false
})
export class AppComponent {

  constructor(private router: Router) {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.router.navigate(['/puntos']);
      } else {
        this.router.navigate(['/auth/login']);
      }
    });
  }
}
