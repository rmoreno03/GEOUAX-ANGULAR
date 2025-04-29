import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RutasService } from '../../services/rutas.service';
import { Ruta } from '../../../../models/ruta.model';
import { PuntoLocalizacion } from '../../../../models/punto-localizacion.model';
import { environment } from '../../../../../environments/environment';
import mapboxgl from 'mapbox-gl';
import mbxDirections from '@mapbox/mapbox-sdk/services/directions';
import { Timestamp } from 'firebase/firestore';

@Component({
  standalone: false,
  selector: 'app-detalle-ruta',
  templateUrl: './detalle-ruta.component.html',
  styleUrls: ['./detalle-ruta.component.css']
})
export class DetalleRutaComponent implements OnInit {
  ruta: Ruta | null = null;
  puntoSeleccionado: PuntoLocalizacion | null = null;
  map!: mapboxgl.Map;
  directionsClient = mbxDirections({ accessToken: environment.mapbox_key });
  markers: mapboxgl.Marker[] = [];
  mostrarConfirmacion = false;
  mostrarMensaje = false;
  mensajeTexto = '';
  tipoMensaje: 'exito' | 'eliminado' | 'warning' = 'exito';
  fotoAmpliada: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rutasService: RutasService
  ) {}

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/rutas/mis-rutas']);
      return;
    }

    try {
      this.ruta = await this.rutasService.obtenerRutaPorId(id);
      console.log('Ruta cargada:', this.ruta);
      console.log('Puntos:', this.ruta?.puntos);
      if (!this.ruta) {
        this.mostrarMensajeError('No se encontró la ruta solicitada');
        this.router.navigate(['/rutas/mis-rutas']);
        return;
      }

      // Inicializar mapa después de cargar datos
      setTimeout(() => {
        this.inicializarMapa();
      }, 100);

    } catch (error) {
      console.error('Error al cargar la ruta', error);
      this.mostrarMensajeError('Error al cargar los datos de la ruta');
      this.router.navigate(['/rutas/mis-rutas']);
    }
  }

  inicializarMapa(): void {
    if (!this.ruta) return;

    mapboxgl.accessToken = environment.mapbox_key;

    this.map = new mapboxgl.Map({
      container: 'map-detalle',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-3.7038, 40.4168], // Default center (Madrid)
      zoom: 12
    });

    this.map.on('load', async () => {
      await this.dibujarRuta();
      this.agregarMarcadores();
      this.centrarRutaCompleta();
    });
  }

  async dibujarRuta(): Promise<void> {
    if (!this.ruta || !this.map) return;

    const waypoints = this.ruta.puntos.map(p => ({
      coordinates: [p.longitud, p.latitud]
    }));

    if (waypoints.length < 2) {
      // Ruta con un solo punto, solo añade el marcador
      return;
    }

    try {
      const response = await this.directionsClient.getDirections({
        profile: this.ruta.tipoRuta || 'driving',
        waypoints,
        geometries: 'geojson'
      }).send();

      const geojson = response.body.routes[0].geometry;

      if (this.map.getSource('ruta')) {
        (this.map.getSource('ruta') as mapboxgl.GeoJSONSource).setData({
          type: 'Feature',
          properties: {},
          geometry: geojson
        });
      } else {
        this.map.addSource('ruta', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: geojson
          }
        });

        this.map.addLayer({
          id: 'ruta-line',
          type: 'line',
          source: 'ruta',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': this.getColorRuta(this.ruta.tipoRuta),
            'line-width': 6,
            'line-opacity': 0.8
          }
        });

        // Añadir capa de brillo para efecto de resplandor
        this.map.addLayer({
          id: 'ruta-glow',
          type: 'line',
          source: 'ruta',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#fff',
            'line-width': 10,
            'line-opacity': 0.3,
            'line-blur': 3
          },
          filter: ['==', '$type', 'LineString']
        }, 'ruta-line');
      }
    } catch (error) {
      console.error('Error al obtener dirección de la ruta', error);
      this.mostrarMensajeError('No se pudo generar la ruta en el mapa');
    }
  }

  agregarMarcadores(): void {
    if (!this.ruta || !this.map) return;

    // Limpiar marcadores anteriores
    this.markers.forEach(marker => marker.remove());
    this.markers = [];

    // Añadir marcadores para cada punto
    this.ruta.puntos.forEach((punto, index) => {
      // Crear elemento personalizado para el marcador
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.backgroundColor = index === 0 ? '#4CAF50' :
                                 index === this.ruta!.puntos.length - 1 ? '#d71920' : '#f7941d';
      el.style.borderRadius = '50%';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.color = 'white';
      el.style.fontWeight = 'bold';
      el.style.boxShadow = '0 3px 6px rgba(0,0,0,0.3)';
      el.style.border = '2px solid white';
      el.style.cursor = 'pointer';
      el.innerHTML = (index + 1).toString();

      // Crear popup
      const popup = new mapboxgl.Popup({ offset: 30 })
        .setHTML(`
          <h3 style="margin:0;font-size:14px;font-weight:600;color:#333">${punto.nombre}</h3>
          <p style="margin:5px 0 0;font-size:12px;color:#666">${punto.descripcion}</p>
        `);

      // Crear y añadir marcador
      const marker = new mapboxgl.Marker(el)
        .setLngLat([punto.longitud, punto.latitud])
        .setPopup(popup)
        .addTo(this.map);

      // Asociar evento click
      marker.getElement().addEventListener('click', () => {
        this.seleccionarPunto(punto);
      });

      this.markers.push(marker);
    });
  }

  seleccionarPunto(punto: PuntoLocalizacion): void {
    this.puntoSeleccionado = punto;

    // Centrar mapa en el punto seleccionado
    if (this.map) {
      this.map.flyTo({
        center: [punto.longitud, punto.latitud],
        zoom: 15,
        speed: 1.2,
        curve: 1.5
      });

      // Resaltar marcador seleccionado
      this.markers.forEach((marker, index) => {
        const element = marker.getElement();

        if (this.ruta?.puntos[index].id === punto.id) {
          element.style.transform = 'scale(1.2)';
          element.style.zIndex = '10';
          element.style.boxShadow = '0 0 0 4px rgba(215, 25, 32, 0.4), 0 4px 8px rgba(0, 0, 0, 0.3)';

          // Abrir popup
          marker.togglePopup();
        } else {
          element.style.transform = 'scale(1)';
          element.style.zIndex = '1';
          element.style.boxShadow = '0 3px 6px rgba(0,0,0,0.3)';
        }
      });
    }
  }

  centrarRutaCompleta(): void {
    if (!this.map || !this.ruta || this.ruta.puntos.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();

    this.ruta.puntos.forEach(punto => {
      bounds.extend([punto.longitud, punto.latitud]);
    });

    this.map.fitBounds(bounds, {
      padding: 100,
      maxZoom: 15,
      duration: 1000
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

  getColorRuta(tipo: string): string {
    switch (tipo) {
      case 'driving':
        return '#f7941d';
      case 'walking':
        return '#4CAF50';
      case 'cycling':
        return '#1565C0';
      default:
        return '#d71920';
    }
  }

  mostrarFotoAmpliada(url: string): void {
    this.fotoAmpliada = url;
  }

  cerrarFotoAmpliada(): void {
    this.fotoAmpliada = null;
  }

  confirmarEliminar(): void {
    this.mostrarConfirmacion = true;
  }

  cancelarEliminar(): void {
    this.mostrarConfirmacion = false;
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

  async eliminarRuta(): Promise<void> {
    if (!this.ruta?.id) return;

    try {
      await this.rutasService.eliminarRutaPorId(this.ruta.id);

      this.mensajeTexto = 'Ruta eliminada correctamente';
      this.tipoMensaje = 'eliminado';
      this.mostrarMensaje = true;

      // Redirigir después de mostrar brevemente el mensaje
      setTimeout(() => {
        this.router.navigate(['/rutas/mis-rutas']);
      }, 1500);

    } catch (error) {
      console.error('Error al eliminar ruta', error);
      this.mostrarMensajeError('No se pudo eliminar la ruta');
    } finally {
      this.mostrarConfirmacion = false;
    }
  }

  mostrarMensajeError(mensaje: string): void {
    this.mensajeTexto = mensaje;
    this.tipoMensaje = 'warning';
    this.mostrarMensaje = true;

    setTimeout(() => {
      this.mostrarMensaje = false;
    }, 3500);
  }
}
