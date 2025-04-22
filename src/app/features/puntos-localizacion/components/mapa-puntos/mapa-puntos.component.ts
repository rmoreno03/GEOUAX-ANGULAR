import { Component, AfterViewInit } from '@angular/core';
import mapboxgl from 'mapbox-gl';
import { environment } from '../../../../../environments/environment';
import { PuntosLocalizacionService } from '../../services/puntosLocalizacion.service';
import { PuntoLocalizacion } from '../../../../models/punto-localizacion.model';

@Component({
  standalone: false,
  selector: 'app-mapa-puntos',
  templateUrl: './mapa-puntos.component.html',
  styleUrls: ['./mapa-puntos.component.css']
})
export class MapaPuntosComponent implements AfterViewInit {
  puntos: PuntoLocalizacion[] = [];
  map!: mapboxgl.Map;
  loading = true;
  error = '';

  constructor(private puntosService: PuntosLocalizacionService) {}

  async ngAfterViewInit(): Promise<void> {
    try {
      this.puntos = await this.puntosService.cargarPuntosLocalizacionPorUsuario(this.puntosService.getUserId() || '');
      this.initMapa();
    } catch (error) {
      this.error = 'No se pudieron cargar los puntos.';
    } finally {
      this.loading = false;
    }
  }

  initMapa(): void {
    mapboxgl.accessToken = environment.mapbox_key;

    this.map = new mapboxgl.Map({
      container: 'mapa',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-3.7038, 40.4168],
      zoom: 5
    });

    this.map.on('load', () => {
      this.puntos.forEach(punto => {
        new mapboxgl.Marker({ color: '#d71920' })
          .setLngLat([punto.longitud, punto.latitud])
          .addTo(this.map);
      });
    });
  }

  centrarPunto(punto: PuntoLocalizacion): void {
    this.map.flyTo({
      center: [punto.longitud, punto.latitud],
      zoom: 14,
      speed: 1.4,
      curve: 1,
      essential: true
    });
  }
}
