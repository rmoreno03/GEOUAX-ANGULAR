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
    // Verificar si hay algún mensaje para mostrar
    const recibido = this.messageService.getMensaje();
    if (recibido.texto) {
      this.mensajeTexto = recibido.texto;
      this.tipoMensaje = recibido.tipo;
      this.mostrarMensaje = true;

      setTimeout(() => this.mostrarMensaje = false, 3500);
    }

    try {
      // Cargar puntos de localización del usuario actual
      this.puntosLocalizacion = await this.puntosLocalizacionService.cargarPuntosLocalizacionPorUsuario(
        this.puntosLocalizacionService.getUserId() || ''
      );
      this.puntosFiltrados = [...this.puntosLocalizacion];

      // Suscribirse a cambios en filtros
      this.filterService.filter$.subscribe(filtro => {
        this.puntosFiltrados = this.filtrarPuntos(filtro);
      });

      // Suscribirse a cambios en orden
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

  /**
   * Filtra los puntos según los criterios especificados
   */
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

  /**
   * Ordena los puntos según el campo y dirección especificados
   */
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

  /**
   * Convierte diferentes formatos de fecha a objeto Date
   */
  private parseFecha(valor: unknown): Date {
    if (valor instanceof Timestamp) return valor.toDate();
    if (Array.isArray(valor)) return new Date(valor[0]);
    return new Date(valor as string | number | Date);
  }

  /**
   * Formatea una fecha para mostrarla en la tabla
   */
  formatFecha(fecha: Timestamp | Date | string): string {
    if (!fecha) return '';

    let date: Date;

    if (fecha instanceof Date) {
      date = fecha;
    } else if (typeof fecha === 'string') {
      date = new Date(fecha);
    } else if ((fecha as Timestamp).toDate) {
      date = (fecha as Timestamp).toDate();
    } else {
      return '';
    }

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

  /**
   * Abre las coordenadas en Google Maps
   */
  abrirEnGoogleMaps(latitud: number, longitud: number): void {
    window.open(`https://www.google.com/maps?q=${latitud},${longitud}`, '_blank');
  }

  /**
   * Copia una coordenada al portapapeles
   */
  copiarCoordenada(coordenada: number): void {
    navigator.clipboard.writeText(coordenada.toString())
      .then(() => {
        this.mensajeTexto = 'Coordenada copiada al portapapeles';
        this.tipoMensaje = 'exito';
        this.mostrarMensaje = true;

        setTimeout(() => {
          this.mostrarMensaje = false;
        }, 2000);
      })
      .catch(error => {
        console.error('Error al copiar coordenada:', error);
        this.mensajeTexto = 'No se pudo copiar la coordenada';
        this.tipoMensaje = 'warning';
        this.mostrarMensaje = true;

        setTimeout(() => {
          this.mostrarMensaje = false;
        }, 2000);
      });
  }
}
