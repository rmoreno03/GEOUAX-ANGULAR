import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
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

  @Output() filtrar = new EventEmitter<Partial<PuntoLocalizacion>>();
  @Output() ordenar = new EventEmitter<{ campo: string, orden: 'asc' | 'desc' }>();
  @Output() toggleSidebar = new EventEmitter<void>();

  @HostBinding('class.mobile-hidden') @Input() mobileHidden = false;

  title = '';
  showFilter = false;
  showOrdenar = false;
  ordenSelected: 'asc' | 'desc' = 'asc';
  ordenSeleccionadoCampo = '';
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
          { label: 'Ver todos los puntos', icon: 'fas fa-list', action: () => this.router.navigate(['/puntos']) },
          { label: 'Ver todos los puntos en el Mapa', icon: 'fas fa-map-marked-alt', action: () => this.router.navigate(['/puntos/mapa']) },
          { label: 'Nuevo Punto', icon: 'fas fa-plus', action: () => this.router.navigate(['/puntos/nuevo']) },
          { label: 'Filtrar', icon: 'fas fa-filter', action: () => this.toggleFilter() },
          { label: 'Ordenar', icon: 'fas fa-sort', action: () => this.toggleOrdenar() },
          { label: 'Resetear', icon: 'fas fa-sync-alt', action: () => this.resetearTodo() }
        ];

      } else if (url.includes('rutas')) {
        this.title = 'Gestión de Rutas';
        this.menuOptions = [
          { label: 'Nueva Ruta', icon: 'fas fa-plus', action: () => this.router.navigate(['/rutas/crear']) },
          { label: 'Ver Mapa', icon: 'fas fa-map-marked-alt', action: () => this.router.navigate(['/rutas/mapa']) },
          { label: 'Explorar Rutas Públicas', icon: 'fas fa-globe', action: () => this.router.navigate(['/rutas/publicas']) },
          { label: 'Mis Rutas', icon: 'fas fa-user', action: () => this.router.navigate(['/rutas/mis-rutas']) },
          { label: 'Importar GPX/KML', icon: 'fas fa-file-import', action: () => alert('Funcionalidad de importación próximamente') }
        ];

      } else if (url.includes('usuarios')) {
        this.title = 'Usuarios';
        this.menuOptions = [
          { label: 'Nuevo Usuario', icon: 'fas fa-user-plus', action: () => this.router.navigate(['/usuarios/crear']) },
          { label: 'Roles', icon: 'fas fa-user-tag', action: () => this.router.navigate(['/usuarios/roles']) },
          { label: 'Estadísticas por Usuario', icon: 'fas fa-chart-line', action: () => this.router.navigate(['/usuarios/estadisticas']) },
          { label: 'Usuarios Inactivos', icon: 'fas fa-user-slash', action: () => this.router.navigate(['/usuarios/inactivos']) }
        ];

      } else if (url.includes('admin')) {
        this.title = 'Panel de Administración';
        this.menuOptions = [
          { label: 'Gestión de Usuarios', icon: 'fas fa-users-cog', action: () => this.router.navigate(['/admin/usuarios']) },
          { label: 'Permisos y Roles', icon: 'fas fa-key', action: () => this.router.navigate(['/admin/roles']) },
          { label: 'Contenido Reportado', icon: 'fas fa-flag', action: () => this.router.navigate(['/admin/reportes']) },
          { label: 'Auditoría / Logs', icon: 'fas fa-clipboard-list', action: () => this.router.navigate(['/admin/logs']) },
          { label: 'Configuración General', icon: 'fas fa-sliders-h', action: () => this.router.navigate(['/admin/configuracion']) }
        ];

      } else if (url.includes('estadisticas')) {
        this.title = 'Estadísticas';
        this.menuOptions = [
          { label: 'Resumen Global', icon: 'fas fa-chart-pie', action: () => this.router.navigate(['/estadisticas/resumen-global']) },
          { label: 'Mis Estadísticas', icon: 'fas fa-chart-bar', action: () => this.router.navigate(['/estadisticas/mis-estadisticas']) },
          { label: 'Comparativas', icon: 'fas fa-balance-scale', action: () => this.router.navigate(['/estadisticas/comparativas']) },
          { label: 'Impacto Medioambiental', icon: 'fas fa-leaf', action: () => this.router.navigate(['/estadisticas/impacto-medioambiental']) },
          { label: 'Estadísticas por Región', icon: 'fas fa-map', action: () => this.router.navigate(['/estadisticas/estadisticas-region']) }
        ];

      } else if (url.includes('logros')) {
        this.title = 'Logros';
        this.menuOptions = [
          { label: 'Ver Logros', icon: 'fas fa-trophy', action: () => this.router.navigate(['/logros/ver-logros']) },
          { label: 'Mis Retos', icon: 'fas fa-tasks', action: () => this.router.navigate(['/logros/mis-retos']) },
          { label: 'Progreso', icon: 'fas fa-percentage', action: () => this.router.navigate(['/logros/progreso']) },
          { label: 'Crear Reto Personalizado', icon: 'fas fa-plus-circle', action: () => this.router.navigate(['/logros/crear-reto-personalizado']) },
          { label: 'Ranking de Usuarios', icon: 'fas fa-medal', action: () => this.router.navigate(['/logros/ranking-usuarios']) }
        ];

      } else if (url.includes('configuracion')) {
        this.title = 'Configuración';
        this.menuOptions = [
          { label: 'Preferencias del Usuario', icon: 'fas fa-user-cog', action: () => this.router.navigate(['/configuracion/preferencias']) },
          { label: 'Ajustes de Mapa', icon: 'fas fa-map', action: () => this.router.navigate(['/configuracion/mapa']) },
          { label: 'Notificaciones', icon: 'fas fa-bell', action: () => this.router.navigate(['/configuracion/notificaciones']) },
          { label: 'Idioma y Región', icon: 'fas fa-language', action: () => this.router.navigate(['/configuracion/idioma']) },
          { label: 'Apariencia / Tema', icon: 'fas fa-palette', action: () => this.router.navigate(['/configuracion/tema']) }
        ];

      } else if (url.includes('ayuda')) {
        this.title = 'Ayuda / Manual';
        this.menuOptions = [
          { label: 'Inicio', icon: 'fas fa-info-circle', action: () => this.router.navigate(['/ayuda']) },
          { label: 'Tutoriales', icon: 'fas fa-book', action: () => this.router.navigate(['/ayuda/tutoriales']) },
          { label: 'Preguntas Frecuentes', icon: 'fas fa-question', action: () => this.router.navigate(['/ayuda/faq']) },
          { label: 'Contacto', icon: 'fas fa-envelope', action: () => this.router.navigate(['/ayuda/contacto']) },
          { label: 'Guías en PDF', icon: 'fas fa-file-pdf', action: () => this.router.navigate(['/ayuda/guias']) }
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

  onToggleSidebarClick() {
    this.toggleSidebar.emit();
  }

  resetearTodo() {
    this.filtroForm.reset();
    this.filterService.setFilter({
      nombre: '',
      descripcion: '',
      fecha: '',
      usuario: ''
    });

    this.ordenService.resetOrden();
    this.showFilter = false;
    this.showOrdenar = false;
    this.ordenSeleccionadoCampo = '';
  }


  resetearFiltro() {
    this.filtroForm.reset();
    this.filterService.setFilter({
      nombre: '',
      descripcion: '',
      fecha: '',
      usuario: ''
    });

  }



}

