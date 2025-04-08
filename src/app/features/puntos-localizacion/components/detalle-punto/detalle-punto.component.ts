import { Component, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PuntosLocalizacionService } from '../../services/puntosLocalizacion.service';
import { PuntoLocalizacion } from '../../../../models/punto-localizacion.model';
import mapboxgl from 'mapbox-gl';
import { environment } from '../../../../../environments/environment'; // asegúrate de tener tu token aquí

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
}
