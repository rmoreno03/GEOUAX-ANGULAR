import { Component, OnInit } from '@angular/core';
import { RutasService } from '../../services/rutas.service';
import { environment } from '../../../../../environments/environment';
import mapboxgl from 'mapbox-gl';
import mbxDirections from '@mapbox/mapbox-sdk/services/directions';
import { Ruta } from '../../../../models/ruta.model';
import { MessageService } from '../../../../core/services/message.service';

@Component({
  standalone: false,
  selector: 'app-mis-rutas',
  templateUrl: './mis-rutas.component.html',
  styleUrls: ['./mis-rutas.component.css']
})
export class MisRutasComponent implements OnInit {
  rutas: Ruta[] = [];
  mostrarMensaje = false;
  mensajeTexto = '';
  tipoMensaje: 'exito' | 'eliminado' | 'warning' = 'exito';
  rutaSeleccionadaId: string | null = null;
  mostrarConfirmacion: boolean = false;


  directionsClient = mbxDirections({ accessToken: environment.mapbox_key });

  constructor(
    private rutasService: RutasService,
    private mensajeService: MessageService
  ) {}

  async ngOnInit() {
    const recibido = this.mensajeService.getMensaje();
    if (recibido.texto) {
      this.mensajeTexto = recibido.texto;
      this.tipoMensaje = recibido.tipo;
      this.mostrarMensaje = true;
      setTimeout(() => this.mostrarMensaje = false, 3500);
    }

    const uid = this.rutasService['getUserId']();
    if (uid) {
      this.rutas = await this.rutasService.cargarRutasPorUsuario(uid);
      this.inicializarMapas();
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
            paint: { 'line-color': this.getColorRuta(ruta.tipoRuta), 'line-width': 4 }
          });

          ruta.puntos.forEach(punto => {
            new mapboxgl.Marker({ color: '#d71920' })
              .setLngLat([punto.longitud, punto.latitud])
              .addTo(map);
          });

          const bounds = new mapboxgl.LngLatBounds();
          (geojson.coordinates as [number, number][]).forEach(coord => bounds.extend(coord));

          map.once('idle', () => {
            map.fitBounds(bounds, {
              padding: 50,
              maxZoom: 13
            });
          });
        });
      } catch (error) {
        console.error('Error al calcular la ruta:', error);
      }
    });
  }

  eliminarRuta(id: string) {
    this.rutaSeleccionadaId = id;
    this.mostrarConfirmacion = true;
  }

  confirmarEliminacionRuta() {
    if (this.rutaSeleccionadaId) {
      this.rutasService.eliminarRutaPorId(this.rutaSeleccionadaId).then(() => {
        this.rutas = this.rutas.filter(r => r.id !== this.rutaSeleccionadaId);
        this.mensajeTexto = 'Ruta eliminada correctamente.';
        this.tipoMensaje = 'eliminado';
        this.mostrarMensaje = true;
        this.rutaSeleccionadaId = null;
        setTimeout(() => this.mostrarMensaje = false, 3500);
      });
    }
    this.mostrarConfirmacion = false;
  }

  cancelarEliminacionRuta() {
    this.mostrarConfirmacion = false;
    this.rutaSeleccionadaId = null;
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

  getColorRuta(tipo: string): string {
    switch (tipo) {
      case 'driving':
        return '#f7941d';
      case 'walking':
        return '#d71920';
      case 'cycling':
        return '#1f77b4';
      default:
        return '#000000';
    }
  }




}
