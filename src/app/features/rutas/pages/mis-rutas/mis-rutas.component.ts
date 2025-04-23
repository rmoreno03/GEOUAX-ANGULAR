import { Component, OnInit } from '@angular/core';
import { RutasService } from '../../services/rutas.service';
import { environment } from '../../../../../environments/environment';
import mapboxgl from 'mapbox-gl';
import mbxDirections from '@mapbox/mapbox-sdk/services/directions';
import { Ruta } from '../../../../models/ruta.model';

@Component({
  standalone: false,
  selector: 'app-mis-rutas',
  templateUrl: './mis-rutas.component.html',
  styleUrls: ['./mis-rutas.component.css']
})
export class MisRutasComponent implements OnInit {
  rutas: Ruta[] = [];
  directionsClient = mbxDirections({ accessToken: environment.mapbox_key });

  constructor(private rutasService: RutasService) {}

  async ngOnInit() {
    const uid = this.rutasService['getUserId']();
    if (uid) {
      this.rutas = await this.rutasService.cargarRutasPorUsuario(uid);
      console.log('RUTAS CARGADAS:', this.rutas);
      setTimeout(() => this.inicializarMapas(), 0);
    } else {
      console.error('No se ha encontrado el UID del usuario.');
    }
  }

  inicializarMapas() {
    mapboxgl.accessToken = environment.mapbox_key;

    this.rutas.forEach(async (ruta) => {
      const containerId = `map-${ruta.id}`;
      const waypoints = ruta.puntos.map(p => ({
        coordinates: [p.longitud, p.latitud]
      }));

      try {
        const response = await this.directionsClient.getDirections({
          profile: ruta.tipoRuta || 'driving',
          waypoints,
          geometries: 'geojson'
        }).send();

        const geojson = response.body.routes[0].geometry;

        const map = new mapboxgl.Map({
          container: containerId,
          style: 'mapbox://styles/mapbox/streets-v12',
          interactive: false
        });

        map.on('load', () => {
          map.addSource(`ruta-${ruta.id}`, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: geojson
            }
          });

          map.addLayer({
            id: `linea-${ruta.id}`,
            type: 'line',
            source: `ruta-${ruta.id}`,
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: { 'line-color': '#f7941d', 'line-width': 4 }
          });

          // Añadir marcadores
          ruta.puntos.forEach(punto => {
            new mapboxgl.Marker({ color: '#d71920' })
              .setLngLat([punto.longitud, punto.latitud])
              .addTo(map);
          });

          // Centrar el mapa en todos los puntos
          const bounds = new mapboxgl.LngLatBounds();
          (geojson.coordinates as [number, number][]).forEach(coord => bounds.extend(coord));
          map.fitBounds(bounds, { padding: 50 });
        });
      } catch (error) {
        console.error('Error al calcular la ruta:', error);
      }
    });
  }

  getIconoRuta(tipo: string): string {
    switch (tipo) {
      case 'driving':
        return 'fa-solid fa-car';
      case 'walking':
        return 'fa-solid fa-person-walking';
      case 'cycling':
        return 'fa-solid fa-bicycle';
      default:
        return 'fa-solid fa-route';
    }
  }
}
