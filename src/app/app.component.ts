import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container">
        <a class="navbar-brand" href="#">Puntos de Localización</a>
      </div>
    </nav>
    <router-outlet></router-outlet>
  `,
  styles: [],
  standalone: false
})
export class AppComponent {
  title = 'puntos-localizacion-app';
}
