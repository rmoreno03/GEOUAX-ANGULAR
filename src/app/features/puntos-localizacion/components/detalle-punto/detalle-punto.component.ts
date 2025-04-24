import { Component, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PuntosLocalizacionService } from '../../services/puntosLocalizacion.service';
import { PuntoLocalizacion } from '../../../../models/punto-localizacion.model';
import mapboxgl from 'mapbox-gl';
import { environment } from '../../../../../environments/environment';
import { Timestamp } from 'firebase/firestore';
import { MessageService } from '../../../../core/services/message.service';

@Component({
  standalone: false,
  selector: 'app-detalle-punto',
  templateUrl: './detalle-punto.component.html',
  styleUrls: ['./detalle-punto.component.css']
})
export class DetallePuntoComponent implements AfterViewInit {
  punto?: PuntoLocalizacion;
  puntoOriginal: PuntoLocalizacion | null = null;
  loading = true;
  error: string = '';
  map!: mapboxgl.Map;
  modoEdicion = false;
  fechaLocal = '';
  mostrarConfirmacion = false;
  mensajeTexto = '';
  mostrarMensaje = false;
  tipoMensaje: 'exito' | 'warning' = 'exito';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private puntosService: PuntosLocalizacionService,
    private messageService: MessageService
  ) {}

  async ngAfterViewInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      try {
        const punto = await this.puntosService.obtenerPuntoPorId(id);
        this.punto = punto ?? undefined;
        this.puntoOriginal = JSON.parse(JSON.stringify(punto));

        if (this.punto) {
          this.inicializarMapa();
        }
      } catch (err) {
        this.error = 'No se pudo cargar el punto.';
      } finally {
        this.loading = false;
      }
    }
  }

  inicializarMapa(): void {
    if (!this.punto) return;

    mapboxgl.accessToken = environment.mapbox_key;

    this.map = new mapboxgl.Map({
      container: 'map-preview',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [this.punto.longitud, this.punto.latitud],
      zoom: 16
    });

    let marker = new mapboxgl.Marker({ color: '#d71920' })
      .setLngLat([this.punto.longitud, this.punto.latitud])
      .addTo(this.map);

    this.map.on('click', (event) => {
      if (!this.modoEdicion || !this.punto) return;
      const { lng, lat } = event.lngLat;
      this.punto.latitud = lat;
      this.punto.longitud = lng;
      marker.setLngLat([lng, lat]);
      this.map.flyTo({ center: [lng, lat], zoom: 14 });
    });
  }

  async eliminar(): Promise<void> {
    this.mostrarConfirmacion = true;
  }

  confirmarEliminacion() {
    if (this.punto?.id) {
      this.puntosService.eliminarPunto(this.punto.id).then(() => {
        this.messageService.setMensaje('Punto eliminado correctamente', 'eliminado');
        this.router.navigate(['/puntos-localizacion']);
      });
    }
    this.mostrarConfirmacion = false;
  }

  cancelarEliminacion() {
    this.mostrarConfirmacion = false;
  }

  formatFecha(fecha: any): string {
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

  toggleEdicion() {
    this.modoEdicion = !this.modoEdicion;

    if (this.punto?.fechaCreacion?.toDate) {
      const fecha = this.punto.fechaCreacion.toDate();
      this.fechaLocal = fecha.toISOString().slice(0, 16);
    }
  }

  cancelarEdicion() {
    this.modoEdicion = false;
    if (this.punto?.id) {
      this.ngAfterViewInit();
    }
  }

  async guardarCambios(): Promise<void> {
    if (!this.punto?.id) return;

    if (!this.punto.nombre?.trim() || !this.punto.descripcion?.trim()) {
      this.mensajeTexto = 'Completa todos los campos obligatorios.';
      this.tipoMensaje = 'warning';
      this.mostrarMensaje = true;
      setTimeout(() => this.mostrarMensaje = false, 3500);
      return;
    }

    const haCambiado = JSON.stringify(this.punto) !== JSON.stringify(this.puntoOriginal);
    if (!haCambiado) {
      this.mensajeTexto = 'No se han realizado cambios.';
      this.tipoMensaje = 'warning';
      this.mostrarMensaje = true;
      setTimeout(() => this.mostrarMensaje = false, 3500);
      return;
    }

    try {
      await this.puntosService.actualizarPunto(this.punto);
      this.modoEdicion = false;
      this.mensajeTexto = 'Punto actualizado con éxito';
      this.tipoMensaje = 'exito';
      this.mostrarMensaje = true;
      setTimeout(() => this.mostrarMensaje = false, 3500);
      this.puntoOriginal = JSON.parse(JSON.stringify(this.punto));
      this.inicializarMapa();
    } catch (err) {
      console.error('Error al actualizar el punto', err);
      this.mensajeTexto = 'Hubo un error al guardar los cambios.';
      this.tipoMensaje = 'warning';
      this.mostrarMensaje = true;
      setTimeout(() => this.mostrarMensaje = false, 3500);
    }
  }
}
