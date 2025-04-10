import { Component, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PuntosLocalizacionService } from '../../services/puntosLocalizacion.service';
import { PuntoLocalizacion } from '../../../../models/punto-localizacion.model';
import mapboxgl from 'mapbox-gl';
import { environment } from '../../../../../environments/environment'; // asegúrate de tener tu token aquí
import { Timestamp } from 'firebase/firestore';

@Component({
  standalone: false,
  selector: 'app-detalle-punto',
  templateUrl: './detalle-punto.component.html',
  styleUrls: ['./detalle-punto.component.css']
})
export class DetallePuntoComponent implements AfterViewInit {
  punto?: PuntoLocalizacion;
  loading = true;
  error: string = '';
  map!: mapboxgl.Map;
  modoEdicion = false;
  fechaLocal = '';


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private puntosService: PuntosLocalizacionService
  ) {}

  async ngAfterViewInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      try {
        const punto = await this.puntosService.obtenerPuntoPorId(id);
        this.punto = punto ?? undefined;

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
      zoom: 14
    });


    new mapboxgl.Marker({ color: '#d71920' })
      .setLngLat([this.punto.longitud, this.punto.latitud])
      .addTo(this.map);

      let marker = new mapboxgl.Marker({ color: '#d71920' })
        .setLngLat([this.punto.longitud, this.punto.latitud])
        .addTo(this.map);

      // Permitir mover el marcador haciendo clic en el mapa (solo en edición)
      this.map.on('click', (event) => {
        if (!this.modoEdicion || !this.punto) return;

        const { lng, lat } = event.lngLat;

        // Actualiza coordenadas en el modelo
        this.punto.latitud = lat;
        this.punto.longitud = lng;


        // Mueve el marcador
        marker.setLngLat([lng, lat]);
        this.map.flyTo({ center: [lng, lat], zoom: 14 });

      });
  }

  async eliminar(): Promise<void> {
    if (this.punto?.id && confirm('¿Estás seguro de que deseas eliminar este punto?')) {
      await this.puntosService.eliminarPunto(this.punto.id);
      this.router.navigate(['/puntos-localizacion']);
    }
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

    // Convertir timestamp a datetime-local si existe
    if (this.punto?.fechaCreacion?.toDate) {
      const fecha = this.punto.fechaCreacion.toDate();
      this.fechaLocal = fecha.toISOString().slice(0, 16); // formato para input[type=datetime-local]
    }
  }

  cancelarEdicion() {
    this.modoEdicion = false;

    if (this.punto?.id) {
      this.ngAfterViewInit(); // Recargar datos y reinicializar el mapa
    }
  }

  async guardarCambios(): Promise<void> {
    if (!this.punto?.id) return;


    const puntoActualizado: PuntoLocalizacion = {
      ...this.punto,
    };

    try {
      await this.puntosService.actualizarPunto(puntoActualizado);
      this.modoEdicion = false;
      alert('Punto actualizado con éxito');
      this.inicializarMapa();
    } catch (err) {
      console.error('Error al actualizar el punto', err);
      alert('Hubo un error al guardar los cambios.');
    }
  }

}
