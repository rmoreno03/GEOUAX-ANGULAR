import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RutasService } from '../../services/rutas.service';
import mapboxgl from 'mapbox-gl';
import mbxDirections from '@mapbox/mapbox-sdk/services/directions';
import { environment } from '../../../../../environments/environment';

@Component({
  standalone: false,
  selector: 'app-detalle-ruta',
  templateUrl: './detalle-ruta.component.html',
  styleUrls: ['./detalle-ruta.component.css']
})
export class DetalleRutaComponent implements OnInit {
  directionsClient = mbxDirections({ accessToken: environment.mapbox_key });
  rutaId!: string;

  constructor(private route: ActivatedRoute, private router: Router, private rutasService: RutasService) {}

  async ngOnInit() {
    this.rutaId = this.route.snapshot.params['id'];
    const ruta = await this.rutasService.obtenerRutaPorId(this.rutaId);

    const waypoints = ruta!.puntos.map(p => ({
      coordinates: [p.longitud, p.latitud]
    }));

    const response = await this.directionsClient.getDirections({
      profile: ruta!.tipoRuta || 'driving',
      waypoints,
      geometries: 'geojson'
    }).send();

    const map = new mapboxgl.Map({
      container: 'map-detalle',
      style: 'mapbox://styles/mapbox/streets-v12'
    });

    const geojson = response.body.routes[0].geometry;

    map.on('load', () => {
      map.addSource('ruta', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: geojson,
          properties: {}
        }
      });

      map.addLayer({
        id: 'linea',
        type: 'line',
        source: 'ruta',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#f7941d', 'line-width': 4 }
      });

      // Marcadores
      ruta!.puntos.forEach(punto => {
        new mapboxgl.Marker({ color: '#d71920' })
          .setLngLat([punto.longitud, punto.latitud])
          .addTo(map);
      });

      const bounds = new mapboxgl.LngLatBounds();
      geojson.coordinates.forEach((coord: any) => bounds.extend(coord));
      map.fitBounds(bounds, { padding: 40 });
    });
  }

  async eliminarRuta() {
    await this.rutasService.eliminarRutaPorId(this.rutaId);
    this.router.navigate(['/rutas/mis-rutas']);
  }
}
