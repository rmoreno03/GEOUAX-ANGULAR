import { Component, AfterViewInit } from '@angular/core';
import { RutasService } from '../../services/rutas.service';
import mapboxgl from 'mapbox-gl';
import mbxDirections from '@mapbox/mapbox-sdk/services/directions';
import { environment } from '../../../../../environments/environment';
import { Ruta } from '../../../../models/ruta.model';

@Component({
  standalone : false,
  selector: 'app-ver-todas',
  templateUrl: './ver-todas.component.html',
  styleUrls: ['./ver-todas.component.css']
})
export class VerTodasComponent implements AfterViewInit {
  rutas: Ruta[] = [];
  map!: mapboxgl.Map;
  directionsClient = mbxDirections({ accessToken: environment.mapbox_key });

  constructor(private rutasService: RutasService) {}

  async ngAfterViewInit(): Promise<void> {
    this.rutas = await this.rutasService.cargarRutasPorUsuario(this.rutasService['getUserId']() || '');
    this.initMapa();
  }

  initMapa(): void {
    mapboxgl.accessToken = environment.mapbox_key;
    this.map = new mapboxgl.Map({
      container: 'mapa',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-3.7038, 40.4168],
      zoom: 9
    });

    this.map.on('load', () => {
      this.rutas.forEach(async (ruta) => {
        const waypoints = ruta.puntos.map(p => ({
          coordinates: [p.longitud, p.latitud],
        }));

        try {
          const res = await this.directionsClient.getDirections({
            profile: ruta.tipoRuta || 'driving',
            waypoints,
            geometries: 'geojson'
          }).send();

          const geometry = res.body.routes[0].geometry;

          this.map.addSource(`ruta-${ruta.id}`, {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry,
              properties: {}
            }
          });

          this.map.addLayer({
            id: `linea-${ruta.id}`,
            type: 'line',
            source: `ruta-${ruta.id}`,
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: { 'line-color': '#f7941d', 'line-width': 4 }
          });
        } catch (error) {
          console.error(`Error al mostrar ruta ${ruta.id}`, error);
        }
      });
    });
  }

  centrarRuta(ruta: Ruta): void {
    const bounds = new mapboxgl.LngLatBounds();
    ruta.puntos.forEach(p => bounds.extend([p.longitud, p.latitud]));
    this.map.flyTo({
      center: bounds.getCenter(),
      zoom: 14,
      speed: 1.5,
      curve: 1.2,
      essential: true
    });
  }
}
