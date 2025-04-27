import { Component, OnInit } from '@angular/core';
import { PuntoLocalizacion } from '../../../../models/punto-localizacion.model';
import { PuntosLocalizacionService } from '../../services/puntosLocalizacion.service';
import { FilterService } from '../../../../core/services/filter.service';
import { Timestamp } from 'firebase/firestore';
import { OrdenService } from '../../../../core/services/orden.service';
import { MessageService } from '../../../../core/services/message.service';
import { FiltroPuntoLocalizacion } from '../../../../models/filtrar-punto-localizacion.model';


@Component({
  selector: 'app-puntos-localizacion',
  templateUrl: './puntos-localizacion.component.html',
  styleUrls: ['./puntos-localizacion.component.css'],
  standalone: false
})
export class PuntosLocalizacionComponent implements OnInit {
  puntosLocalizacion: PuntoLocalizacion[] = [];
  puntosFiltrados: PuntoLocalizacion[] = [];
  loading = true;
  error = '';
  ordenCampo = '';
  ordenDireccion: 'asc' | 'desc' = 'asc';
  mensajeTexto = '';
  mostrarMensaje = false;
  tipoMensaje: 'exito' | 'eliminado' | 'warning' = 'exito';

  constructor(
    private puntosLocalizacionService: PuntosLocalizacionService,
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
      //this.puntosLocalizacion = await this.puntosLocalizacionService.cargarPuntosLocalizacion(); para ver todos los puntos de todos los usuarios
      this.puntosLocalizacion = await this.puntosLocalizacionService.cargarPuntosLocalizacionPorUsuario(this.puntosLocalizacionService.getUserId() || '');
      this.puntosFiltrados = [...this.puntosLocalizacion];

      this.filterService.filter$.subscribe(filtro => {
        this.puntosFiltrados = this.filtrarPuntos(filtro);
      });

      this.ordenService.orden$.subscribe(orden => {
        if (orden) {
          this.ordenarPuntos(orden);
        }
      });

    } catch (error) {
      this.error = 'Error al cargar los puntos de localización';
      console.error(error);
    } finally {
      this.loading = false;
    }
  }

  private filtrarPuntos(filtro: FiltroPuntoLocalizacion): PuntoLocalizacion[] {
    return this.puntosLocalizacion.filter(p => {
      const coincideNombre =
        !filtro.nombre ||
        p.nombre?.toLowerCase().includes(filtro.nombre.toLowerCase());

      const coincideDescripcion =
        !filtro.descripcion ||
        p.descripcion?.toLowerCase().includes(filtro.descripcion.toLowerCase());

      const coincideFecha =
        !filtro.fecha ||
        (p.fechaCreacion &&
          p.fechaCreacion.toDate().toISOString().startsWith(filtro.fecha));

      const coincideUsuario =
        !filtro.usuario ||
        p.usuarioCreador?.toLowerCase().includes(filtro.usuario.toLowerCase());

      return coincideNombre && coincideDescripcion && coincideFecha && coincideUsuario;
    });
  }

  ordenarPuntos({ campo, orden }: { campo: string, orden: 'asc' | 'desc' }) {
    this.ordenCampo = campo;
    this.ordenDireccion = orden;

    const dir = orden === 'asc' ? 1 : -1;

    this.puntosFiltrados.sort((a, b) => {
      const aVal = a[campo as keyof PuntoLocalizacion];
      const bVal = b[campo as keyof PuntoLocalizacion];

      if (aVal == null) return 1 * dir;
      if (bVal == null) return -1 * dir;

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



  formatFecha(fecha: Timestamp | null | undefined): string {
    if (!fecha?.toDate) return '';
    const date = fecha.toDate();
    return date.toLocaleString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(',', '');
  }



  // Función para abrir en Google Maps
  abrirEnGoogleMaps(latitud: number, longitud: number): void {
    window.open(`https://www.google.com/maps?q=${latitud},${longitud}`, '_blank');
  }
}
