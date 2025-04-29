import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { RutasService } from '../../services/rutas.service';
import { Ruta } from '../../../../models/ruta.model';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  standalone: false,
  selector: 'app-rutas-publicas',
  templateUrl: './rutas-publicas.component.html',
  styleUrls: ['./rutas-publicas.component.css'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [style({ opacity: 0 }), animate('300ms ease-out', style({ opacity: 1 }))]),
      transition(':leave', [animate('300ms ease-in', style({ opacity: 0 }))])
    ])
  ]
})
export class RutasPublicasComponent implements OnInit, AfterViewInit, OnDestroy {
  rutasOriginales: Ruta[] = [];
  rutasFiltradas: Ruta[] = [];
  cargando = true;
  mostrarMensaje = false;
  mensajeTexto = '';
  tipoMensaje: 'exito' | 'warning' | 'eliminado' | 'info' = 'exito';

  busquedaControl = new FormControl('');
  tipoRutaControl = new FormControl('todos');
  ordenControl = new FormControl('recientes');

  itemsPorPagina = 12;
  paginaActual = 1;
  totalPaginas = 1;

  private destroy$ = new Subject<void>();

  constructor(
    private rutasService: RutasService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      this.rutasOriginales = await this.rutasService.cargarRutasPublicas();
      this.aplicarFiltros();
      this.configurarSuscripciones();
      this.cargando = false;
    } catch (error) {
      console.error('Error al cargar rutas públicas:', error);
      this.mostrarMensajeError('Error al cargar rutas públicas. Por favor, inténtalo de nuevo más tarde.');
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const tarjetas = document.querySelectorAll('.tarjeta-ruta');
      tarjetas.forEach((tarjeta, index) => {
        (tarjeta as HTMLElement).style.setProperty('--index', index.toString());
      });
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  configurarSuscripciones(): void {
    this.busquedaControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.paginaActual = 1;
        this.aplicarFiltros();
      });

    this.tipoRutaControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.paginaActual = 1;
        this.aplicarFiltros();
      });

    this.ordenControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.aplicarFiltros());
  }

  aplicarFiltros(): void {
    let rutas = [...this.rutasOriginales];
    const busqueda = this.busquedaControl.value?.toLowerCase() || '';
    const tipo = this.tipoRutaControl.value || 'todos';
    const orden = this.ordenControl.value || 'recientes';

    if (busqueda) {
      rutas = rutas.filter(ruta =>
        ruta.nombre?.toLowerCase().includes(busqueda) ||
        ruta.descripcion?.toLowerCase().includes(busqueda) ||
        ruta.ubicacionInicio?.toLowerCase().includes(busqueda)
      );
    }

    if (tipo !== 'todos') {
      rutas = rutas.filter(ruta => ruta.tipoRuta === tipo);
    }

    rutas = this.ordenarRutas(rutas, orden);

    this.rutasFiltradas = rutas;
    this.calcularTotalPaginas();
  }

  ordenarRutas(rutas: Ruta[], criterio: string): Ruta[] {
    switch (criterio) {
      case 'recientes':
        return [...rutas].sort((a, b) =>
          (b.fechaCreacion as Timestamp).toDate().getTime() - (a.fechaCreacion as Timestamp).toDate().getTime()
        );
      case 'valoracion':
        return [...rutas].sort((a, b) => (b.valoracionPromedio || 0) - (a.valoracionPromedio || 0));
      case 'populares':
        return [...rutas].sort((a, b) => (b.visitas || 0) - (a.visitas || 0));
      case 'distancia':
        return [...rutas].sort((a, b) => (a.distanciaKm || 0) - (b.distanciaKm || 0));
      default:
        return rutas;
    }
  }

  calcularTotalPaginas(): void {
    this.totalPaginas = Math.max(1, Math.ceil(this.rutasFiltradas.length / this.itemsPorPagina));
    if (this.paginaActual > this.totalPaginas) {
      this.paginaActual = this.totalPaginas;
    }
  }

  get rutasPaginadas(): Ruta[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    return this.rutasFiltradas.slice(inicio, inicio + this.itemsPorPagina);
  }

  irAPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      document.querySelector('.contenedor-publicas')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  get paginas(): number[] {
    const visible = 5;
    const mitad = Math.floor(visible / 2);
    let inicio = this.paginaActual - mitad;
    let fin = this.paginaActual + mitad;

    if (inicio < 1) {
      fin += 1 - inicio;
      inicio = 1;
    }
    if (fin > this.totalPaginas) {
      inicio -= fin - this.totalPaginas;
      fin = this.totalPaginas;
    }

    inicio = Math.max(1, inicio);
    return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
  }

  async verDetalleRuta(id: string | undefined): Promise<void> {
    if (!id) return;

    try {
      await this.rutasService.incrementarVisitas(id);
    } catch (error) {
      console.error('Error incrementando visitas:', error);
    }

    this.router.navigate(['/rutas/detalle/', id]);
  }

  mostrarMensajeError(mensaje: string): void {
    this.mensajeTexto = mensaje;
    this.tipoMensaje = 'warning';
    this.mostrarMensaje = true;
    setTimeout(() => this.mostrarMensaje = false, 4000);
  }

  getIconoTipo(tipo: string | undefined): string {
    switch (tipo?.toLowerCase()) {
      case 'driving': return 'fa-car';
      case 'walking': return 'fa-walking';
      case 'cycling': return 'fa-bicycle';
      default: return 'fa-map-marked-alt';
    }
  }

  getEstrellas(valoracion = 0): number[] {
    return Array(5).fill(0).map((_, i) => i < Math.round(valoracion) ? 1 : 0);
  }

  formatearFecha(fecha: Timestamp | undefined): string {
    if (!fecha) return 'Fecha no disponible';
    return fecha.toDate().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatearNumero(valor: number | undefined, sufijo = ''): string {
    if (valor === undefined || valor === null) return 'N/D';
    return `${valor.toFixed(1)}${sufijo}`;
  }
}
