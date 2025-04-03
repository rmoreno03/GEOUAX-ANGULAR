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
  showFilter = false;
  menuOptions: { label: string, action: () => void }[] = [];

  constructor(private router: Router) {
    router.events.subscribe(() => {
      const url = router.url;

      if (url.includes('puntos-localizacion')) {
        this.title = 'Gestión de Puntos';
        this.menuOptions = [
          { label: 'Ver todos los puntos', action: () => this.router.navigate(['/puntos-localizacion']) },
          { label: 'Ver todos los puntos en el Mapa', action: () => alert('Mostrando mapa...') },
          { label: 'Nuevo Punto', action: () => this.router.navigate(['/puntos-localizacion/nuevo']) },
          { label: 'Filtrar', action: () => this.toggleFilter() },
          { label: 'Ordenar', action: () => alert('Ordenando...') }
        ];
      } else if (url.includes('rutas')) {
        this.title = 'Gestión de Rutas';
        this.menuOptions = [
          { label: 'Nueva Ruta', action: () => this.router.navigate(['/rutas/crear']) },
          { label: 'Ver Mapa', action: () => alert('Mostrando mapa...') }
        ];
      } else if (url.includes('usuarios')) {
        this.title = 'Usuarios';
        this.menuOptions = [
          { label: 'Nuevo Usuario', action: () => this.router.navigate(['/usuarios/crear']) },
          { label: 'Roles', action: () => alert('Gestionando roles...') }
        ];
      } else {
        this.title = '';
        this.menuOptions = [];
      }
    });
  }

  toggleFilter() {
    this.showFilter = !this.showFilter;
  }

  aplicarFiltro() {
    // Lógica de filtro aquí
    console.log('Filtrando...');
    this.showFilter = false;
  }
}

