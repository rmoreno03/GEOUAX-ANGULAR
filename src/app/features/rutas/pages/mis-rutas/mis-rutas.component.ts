import { Component, OnInit } from '@angular/core';
import { RutasService } from '../../services/rutas.service';
import { environment } from '../../../../../environments/environment';
import mapboxgl from 'mapbox-gl';
import mbxDirections from '@mapbox/mapbox-sdk/services/directions';
import { Ruta } from '../../../../models/ruta.model';
import { MessageService } from '../../../../core/services/message.service';
import { Timestamp } from 'firebase/firestore';
import { ProgresoRuta } from '../../../../models/progreso-ruta.model';
import { ProgresoRutaService } from '../../../ruta-seguimiento/services/progreso-ruta.service';

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
  mostrarConfirmacion = false;
  progresosRutas: Record<string, ProgresoRuta> = {};
  cargandoProgresos = false;


  directionsClient = mbxDirections({ accessToken: environment.mapbox_key });

  constructor(
    private rutasService: RutasService,
    private mensajeService: MessageService,
    private progresoRutaService: ProgresoRutaService
  ) {}

  async ngOnInit() {
    const recibido = this.mensajeService.getMensaje();
    if (recibido.texto) {
      this.mensajeTexto = recibido.texto;
      this.tipoMensaje = recibido.tipo;
      this.mostrarMensaje = true;
      setTimeout(() => this.mostrarMensaje = false, 3500);
    }

    const uid = this.rutasService.getUserId();
    if (uid) {
      this.cargandoProgresos = true;

      // Cargar rutas
      this.rutas = await this.rutasService.cargarRutasPorUsuario(uid);

      // Cargar progresos de ruta
      await this.cargarProgresosRuta();

      this.inicializarMapas();
      this.cargandoProgresos = false;
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

  async cargarProgresosRuta(): Promise<void> {
    try {
      // Obtener rutas en progreso
      const rutasEnProgreso = await this.progresoRutaService.obtenerRutasEnProgreso();

      // Obtener rutas completadas
      const rutasCompletadas = await this.progresoRutaService.obtenerRutasCompletadas();

      // Combinar ambos arrays
      const todosProgresos = [...rutasEnProgreso, ...rutasCompletadas];

      // Indexar por rutaId para acceso rápido
      this.progresosRutas = {};
      todosProgresos.forEach(progreso => {
        this.progresosRutas[progreso.rutaId] = progreso;
      });
    } catch (error) {
      console.error('Error al cargar progresos de rutas:', error);
    }
  }

  // Añadir método para verificar el estado de una ruta
  getEstadoRuta(rutaId: string): 'no-iniciada' | 'en-progreso' | 'completada' {
    if (!this.progresosRutas[rutaId]) {
      return 'no-iniciada';
    }

    return this.progresosRutas[rutaId].completado ? 'completada' : 'en-progreso';
  }

  // Añadir método para obtener el progreso de una ruta
  getProgresoRuta(rutaId: string): number {
    if (!this.progresosRutas[rutaId]) {
      return 0;
    }

    const progreso = this.progresosRutas[rutaId];
    const totalPuntos = Object.keys(progreso.puntosCompletados).length;

    if (totalPuntos === 0) return 0;

    let completados = 0;
    for (const id in progreso.puntosCompletados) {
      if (progreso.puntosCompletados[id]) {
        completados++;
      }
    }

    return Math.round((completados / totalPuntos) * 100);
  }

  // Añadir método para calcular la fecha de último progreso
  getUltimaActividad(rutaId: string): string {
    if (!this.progresosRutas[rutaId] || !this.progresosRutas[rutaId].fechaUltimaActividad) {
      return 'Nunca';
    }

    const fecha = this.progresosRutas[rutaId].fechaUltimaActividad?.toDate();
    return this.formatFecha(fecha);
  }




}
