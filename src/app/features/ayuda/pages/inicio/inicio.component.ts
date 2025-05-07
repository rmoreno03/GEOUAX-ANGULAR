import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-inicio-ayuda',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css']
})
export class InicioComponent {
  searchTerm = '';

  pasos = [
    {
      numero: 1,
      titulo: 'Configura tu perfil',
      descripcion: 'Personaliza tu perfil para que otros usuarios conozcan tus intereses y logros.',
      ruta: '/perfil',
      boton: 'Ir al perfil',
      icono: 'fa-user-cog'
    },
    {
      numero: 2,
      titulo: 'Crea puntos de interés',
      descripcion: 'Agrega ubicaciones relevantes y compártelas con la comunidad.',
      ruta: '/puntos/crear',
      boton: 'Crear punto',
      icono: 'fa-map-marker-alt'
    },
    {
      numero: 3,
      titulo: 'Crea rutas personalizadas',
      descripcion: 'Combina varios puntos para formar una ruta con propósito.',
      ruta: '/rutas/crear',
      boton: 'Crear ruta',
      icono: 'fa-route'
    },
    {
      numero: 4,
      titulo: 'Explora rutas públicas',
      descripcion: 'Descubre rutas creadas por otros usuarios y úsalas como inspiración.',
      ruta: '/rutas/publicas',
      boton: 'Ver rutas',
      icono: 'fa-compass'
    },
    {
      numero: 5,
      titulo: 'Consulta tu huella de carbono',
      descripcion: 'Evalúa el impacto ambiental de tus rutas y contribuye a un mundo más verde.',
      ruta: '/huella-carbono', //poner algo mas tarde
      boton: 'Ver huella',
      icono: 'fa-leaf'
    },
    {
      numero: 6,
      titulo: 'Comparte con la comunidad',
      descripcion: 'Publica tus rutas favoritas y conecta con otros exploradores de GeoUAX.',
      ruta: '/perfil/mis-rutas',
      boton: 'Mis rutas',
      icono: 'fa-share-alt'
    }
  ];

  temas = [
    'crear ruta',
    'editar perfil',
    'compartir',
    'privacidad',
    'amigos',
    'notificaciones'
  ];

  constructor(private router: Router) {}

  searchHelp(): void {
    // Aquí puedes hacer una redirección o lógica de búsqueda real
    if (this.searchTerm.trim()) {
      console.log('Buscando ayuda sobre:', this.searchTerm);
      // ejemplo: this.router.navigate(['/ayuda/busqueda'], { queryParams: { q: this.searchTerm } });
    }
  }

  setSearchTerm(term: string): void {
    this.searchTerm = term;
    this.searchHelp();
  }
}
