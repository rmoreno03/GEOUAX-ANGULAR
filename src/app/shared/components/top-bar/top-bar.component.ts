import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-topbar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.css']
})
export class TopBarComponent {

  @Output() toggleSidebar = new EventEmitter<void>();

  title = '';

  constructor(private router: Router) {
    router.events.subscribe(() => {
      const url = router.url;
      if (url.includes('puntos-localizacion')) this.title = 'Gestión de Puntos';
      else if (url.includes('rutas')) this.title = 'Gestión de Rutas';
      else if (url.includes('usuarios')) this.title = 'Usuarios';
      else this.title = '';
    });
  }
}
