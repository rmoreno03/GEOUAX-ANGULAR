import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { PuntosLocalizacionService } from '../../../puntos-localizacion/services/puntosLocalizacion.service';
import { PuntoLocalizacion } from '../../../../models/punto-localizacion.model';
import { FilterService } from '../../../../core/services/filter.service';
import { OrdenService } from '../../../../core/services/orden.service';

@Component({
  standalone: false,
  selector: 'app-topbar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.css']
})

export class TopBarComponent {

  @Output() onFiltrar = new EventEmitter<Partial<PuntoLocalizacion>>();
  @Output() onOrdenar = new EventEmitter<{ campo: string, orden: 'asc' | 'desc' }>();
  @Output() toggleSidebar = new EventEmitter<void>();

  title = '';
  showFilter = false;
  showOrdenar = false;
  ordenSelected: 'asc' | 'desc' = 'asc';
  ordenSeleccionadoCampo: string = '';
  menuOptions: { label: string; icon?: string; action: () => void }[] = [];
  filtroForm: FormGroup;
  camposOrdenables: string[] = ['nombre', 'descripcion', 'fechaCreacion', 'latitud', 'longitud', 'usuarioCreador'];


  constructor(
    private router: Router,
    private filterService: FilterService,
    private fb: FormBuilder,
    private ordenService: OrdenService
  ){

    this.filtroForm = this.fb.group({
      nombre: [''],
      descripcion: [''],
      fecha: [''],
      usuario: ['']
    });

    router.events.subscribe(() => {
      const url = router.url;

      if (url.includes('puntos')) {
        this.title = 'Gestión de Puntos';
        this.menuOptions = [
          {
            label: 'Ver todos los puntos',
            icon: 'fas fa-list',
            action: () => this.router.navigate(['/puntos'])
          },
          {
            label: 'Ver todos los puntos en el Mapa',
            icon: 'fas fa-map-marked-alt',
            action: () => this.router.navigate(['/puntos/mapa'])
          },
          {
            label: 'Nuevo Punto',
            icon: 'fas fa-plus',
            action: () => this.router.navigate(['/puntos/nuevo'])
          },
          {
            label: 'Filtrar',
            icon: 'fas fa-filter',
            action: () => this.toggleFilter()
          },
          {
            label: 'Ordenar',
            icon: 'fas fa-sort',
            action: () => this.toggleOrdenar()
          },
          {
            label: 'Resetear',
            icon: 'fas fa-sync-alt',
            action: () => this.resetearTodo()
          }
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

  toggleOrdenar() {
    this.showOrdenar = !this.showOrdenar;
  }


  async aplicarFiltro() {
    const filtros = this.filtroForm.value;
    this.filterService.setFilter(filtros);
    this.showFilter = false;
  }


  async aplicarOrden(campo: string) {
    this.ordenSeleccionadoCampo = campo;
    this.ordenService.setOrden({ campo, orden: this.ordenSelected });
    this.showOrdenar = false;
  }


  resetearTodo() {
    this.filtroForm.reset();
    this.filterService.setFilter('');
    this.ordenService.resetOrden();
    this.showFilter = false;
    this.showOrdenar = false;
    this.ordenSeleccionadoCampo = '';
  }


  resetearFiltro() {
    this.filtroForm.reset();
    this.filterService.setFilter('');
  }



}

