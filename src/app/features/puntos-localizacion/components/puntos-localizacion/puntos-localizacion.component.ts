import { Component, OnInit } from '@angular/core';
import { PuntoLocalizacion } from '../../../../models/punto-localizacion.model';
import { PuntosLocalizacionService } from '../../services/puntosLocalizacion.service';
import { FilterService } from '../../../../core/services/filter.service';
import { OrdenService } from '../../../../core/services/orden.service';
import { MessageService } from '../../../../core/services/message.service';
import { FiltroPuntoLocalizacion } from '../../../../models/filtrar-punto-localizacion.model';
import { Timestamp } from 'firebase/firestore';

@Component({
  standalone: false,
  selector: 'app-puntos-localizacion',
  templateUrl: './puntos-localizacion.component.html',
  styleUrls: ['./puntos-localizacion.component.css']
})
export class PuntosLocalizacionComponent implements OnInit {
  puntosLocalizacion: PuntoLocalizacion[] = [];
  puntosFiltrados: PuntoLocalizacion[] = [];

  loading = true;
  error = '';
  mensajeTexto = '';
  mostrarMensaje = false;
  tipoMensaje: 'exito' | 'eliminado' | 'warning' = 'exito';

  // Paginación
  paginaActual = 1;
  elementosPorPagina = 10;

  // Ordenación
  ordenCampo = '';
  ordenDireccion: 'asc' | 'desc' = 'asc';

  constructor(
    private puntosService: PuntosLocalizacionService,
    private filterService: FilterService,
    private ordenService: OrdenService,
    private messageService: MessageService
  ) {}

  async ngOnInit(): Promise<void> {
    const recibido = this.messageService.getMensaje();
    if (recibido.texto) {
      this.mensajeTexto = recibido.texto;
      this.tipoMensaje = recibido.tipo;
      this.mostrarMensaje = true;
      setTimeout(() => this.mostrarMensaje = false, 3500);
    }

    try {
      const userId = this.puntosService.getUserId() || '';
      this.puntosLocalizacion = await this.puntosService.cargarPuntosLocalizacionPorUsuario(userId);
      this.puntosFiltrados = [...this.puntosLocalizacion];

      this.filterService.filter$.subscribe(filtro => {
        this.puntosFiltrados = this.aplicarFiltros(filtro);
        this.paginaActual = 1; // reinicia al cambiar filtros
      });

      this.ordenService.orden$.subscribe(orden => {
        if (orden) this.ordenarPuntos(orden);
      });

    } catch (e) {
      this.error = 'No se pudieron cargar los puntos.';
      console.error(e);
    } finally {
      this.loading = false;
    }
  }

  get puntosPaginados(): PuntoLocalizacion[] {
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
    const fin = inicio + this.elementosPorPagina;
    return this.puntosFiltrados.slice(inicio, fin);
  }

  get totalPaginas(): number {
    return Math.ceil(this.puntosFiltrados.length / this.elementosPorPagina);
  }

  siguientePagina(): void {
    if (this.paginaActual < this.totalPaginas) this.paginaActual++;
  }

  anteriorPagina(): void {
    if (this.paginaActual > 1) this.paginaActual--;
  }

  private aplicarFiltros(filtro: FiltroPuntoLocalizacion): PuntoLocalizacion[] {
    return this.puntosLocalizacion.filter(p => {
      const coincideNombre = !filtro.nombre || p.nombre?.toLowerCase().includes(filtro.nombre.toLowerCase());
      const coincideDescripcion = !filtro.descripcion || p.descripcion?.toLowerCase().includes(filtro.descripcion.toLowerCase());
      const coincideFecha = !filtro.fecha || (p.fechaCreacion && p.fechaCreacion.toDate().toISOString().startsWith(filtro.fecha));
      return coincideNombre && coincideDescripcion && coincideFecha;
    });
  }

  ordenarPuntos({ campo, orden }: { campo: string; orden: 'asc' | 'desc' }): void {
    this.ordenCampo = campo;
    this.ordenDireccion = orden;
    const dir = orden === 'asc' ? 1 : -1;

    this.puntosFiltrados.sort((a, b) => {
      const aVal = a[campo as keyof PuntoLocalizacion];
      const bVal = b[campo as keyof PuntoLocalizacion];

      if (!aVal) return 1 * dir;
      if (!bVal) return -1 * dir;

      if (campo === 'fechaCreacion') {
        const fechaA = this.parseFecha(aVal);
        const fechaB = this.parseFecha(bVal);
        return (fechaA.getTime() - fechaB.getTime()) * dir;
      }

      return aVal.toString().localeCompare(bVal.toString()) * dir;
    });
  }

  private parseFecha(valor: unknown): Date {
    if (valor instanceof Timestamp) return valor.toDate();
    if (Array.isArray(valor)) return new Date(valor[0]);
    return new Date(valor as string | number | Date);
  }

  formatFecha(fecha: Timestamp | Date | string): string {
    let date: Date;
    if (fecha instanceof Date) date = fecha;
    else if (typeof fecha === 'string') date = new Date(fecha);
    else if ((fecha as Timestamp).toDate) date = (fecha as Timestamp).toDate();
    else return '';

    return date.toLocaleString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  abrirEnGoogleMaps(lat: number, lng: number): void {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  }

  copiarCoordenada(valor: number): void {
    navigator.clipboard.writeText(valor.toString())
      .then(() => {
        this.mensajeTexto = 'Coordenada copiada';
        this.tipoMensaje = 'exito';
        this.mostrarMensaje = true;
        setTimeout(() => this.mostrarMensaje = false, 2000);
      })
      .catch(() => {
        this.mensajeTexto = 'No se pudo copiar';
        this.tipoMensaje = 'warning';
        this.mostrarMensaje = true;
        setTimeout(() => this.mostrarMensaje = false, 2000);
      });
  }
}
