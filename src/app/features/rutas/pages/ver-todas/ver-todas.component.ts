import { Component, AfterViewInit, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { RutasService} from '../../services/rutas.service';
import mapboxgl from 'mapbox-gl';
import mbxDirections from '@mapbox/mapbox-sdk/services/directions';
import { environment } from '../../../../../environments/environment';
import { Ruta, RutaExtendida, RutaExtendidaConGeometria, LineStringGeometry } from '../../../../models/ruta.model';

@Component({
  standalone: false,
  selector: 'app-ver-todas',
  templateUrl: './ver-todas.component.html',
  styleUrls: ['./ver-todas.component.css']
})
export class VerTodasComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapaContainer') mapaContainer!: ElementRef;

  rutas: RutaExtendidaConGeometria[] = [];
  map!: mapboxgl.Map;
  directionsClient = mbxDirections({ accessToken: environment.mapbox_key });
  rutaSeleccionada: RutaExtendidaConGeometria | null = null;
  cargandoMapa = true;
  marcadores: mapboxgl.Marker[] = [];
  activePopup: mapboxgl.Popup | null = null;

  colores: string[] = [
    '#f7941d', '#d71920', '#1d7ef7', '#29c78a', '#bb1c9d',
    '#f1c40f', '#16a085', '#9b59b6', '#e67e22', '#2c3e50'
  ];

  constructor(private rutasService: RutasService) {}

  ngOnInit(): void {
    // Iniciar precarga de datos
    const userId = this.rutasService.getUserId();
    if (userId) {
      this.rutasService.cargarRutasPorUsuario(userId).then(rutasBase => {
        this.prepararRutas(rutasBase);
      });
    }
  }

  async ngAfterViewInit(): Promise<void> {
    this.iniciarMapa();
    this.setupResizeHandling();
  }

  ngOnDestroy(): void {
    // Limpiar recursos al destruir el componente
    if (this.map) {
      this.map.remove();
    }
  }

  iniciarMapa(): void {
    mapboxgl.accessToken = environment.mapbox_key;

    this.map = new mapboxgl.Map({
      container: 'mapa',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-3.7038, 40.4168], // Madrid por defecto
      zoom: 9,
    });

    // Agregar controles de navegación
    this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Esperar a que el mapa cargue para mostrar las rutas
    this.map.on('load', () => {
      this.cargandoMapa = false;
      this.dibujarRutas();

      // Crear botón de reset
      const resetButton = document.createElement('button');
      resetButton.className = 'reset-button';
      resetButton.innerHTML = '<span>Centrar mapa</span>';
      resetButton.onclick = () => this.resetearMapa();

      // Añadir botón personalizado al mapa
      const customControls = document.getElementById('custom-controls');
      if (customControls) {
        customControls.appendChild(resetButton);
      }
    });
  }

  /**
   * Adds resize event handling to make sure the map resizes properly
   * when the sidebar collapses or window size changes
   */
  private setupResizeHandling(): void {
    // Create resize observer for the map container
    const resizeObserver = new ResizeObserver(() => {
      if (this.map) {
        this.map.resize();
      }
    });

    // Observe both container and map element
    const mapaEl = document.getElementById('mapa');
    const containerEl = document.querySelector('.container');

    if (mapaEl) {
      resizeObserver.observe(mapaEl);
    }

    if (containerEl) {
      resizeObserver.observe(containerEl);
    }

    // Add window resize listener as a fallback
    window.addEventListener('resize', () => {
      if (this.map) {
        this.map.resize();
      }
    });

    // Handle sidebar collapse/expand if there's a toggle button elsewhere in the app
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => {
        // Give the DOM time to update
        setTimeout(() => {
          if (this.map) {
            this.map.resize();
          }
        }, 300);
      });
    }
  }

  async prepararRutas(rutasBase: Ruta[]): Promise<void> {
    for (const rutaBase of rutasBase) {
      const waypoints = rutaBase.puntos.map(p => ({ coordinates: [p.longitud, p.latitud] }));

      try {
        const res = await this.directionsClient.getDirections({
          profile: rutaBase.tipoRuta,
          waypoints,
          geometries: 'geojson'
        }).send();

        // La API de Mapbox Direction devuelve LineString para rutas
        const geometry = res.body.routes[0].geometry as LineStringGeometry;
        const distancia = (res.body.routes[0].distance / 1000).toFixed(2) + ' km';
        const duracion = Math.ceil(res.body.routes[0].duration / 60) + ' min';

        // Crear bounds desde las coordenadas
        const bounds = new mapboxgl.LngLatBounds();

        // Asegurar que hay coordenadas disponibles
        if (geometry.coordinates && geometry.coordinates.length > 0) {
          geometry.coordinates.forEach((coord) => {
            const lng = coord[0];
            const lat = coord[1];
            bounds.extend([lng, lat] as mapboxgl.LngLatLike);
          });
        }

        const rutaExtendida: RutaExtendida = {
          ...rutaBase,
          center: bounds,
          popupInfo: { distancia, duracion },
          sourceId: `ruta-${rutaBase.id || ''}`,
          layerId: `linea-${rutaBase.id || ''}`,
          markersIds: []
        };

        // Crear una ruta extendida con geometría
        const rutaCompleta: RutaExtendidaConGeometria = {
          ...rutaExtendida,
          geometry
        };

        this.rutas.push(rutaCompleta);
      } catch (error) {
        console.error(`Error al procesar ruta ${rutaBase.id || 'sin ID'}:`, error);
      }
    }
  }

  dibujarRutas(): void {
    if (!this.map || !this.map.loaded()) return;

    // Si ya tenemos rutas preparadas y el mapa está listo, las dibujamos
    this.rutas.forEach((ruta, index) => {
      const color = this.colores[index % this.colores.length];

      // Añadir fuente y capa al mapa
      if (!this.map.getSource(ruta.sourceId)) {
        this.map.addSource(ruta.sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: ruta.geometry,
            properties: {}
          }
        });

        this.map.addLayer({
          id: ruta.layerId,
          type: 'line',
          source: ruta.sourceId,
          layout: {
            'line-cap': 'round',
            'line-join': 'round'
          },
          paint: {
            'line-color': color,
            'line-width': 4
          }
        });
      }

      // Añadir marcadores
      ruta.puntos.forEach(p => {
        const marker = new mapboxgl.Marker({ color })
          .setLngLat([p.longitud, p.latitud])
          .addTo(this.map);
        this.marcadores.push(marker);
      });
    });

    // Ajustar el mapa para mostrar todas las rutas
    if (this.rutas.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      this.rutas.forEach(ruta => {
        bounds.extend(ruta.center);
      });
      this.map.fitBounds(bounds, { padding: 50 });
    }
  }

  centrarRuta(ruta: RutaExtendidaConGeometria): void {
    if (this.activePopup) {
      this.activePopup.remove();
      this.activePopup = null;
    }

    // Si es la misma ruta que ya estaba seleccionada, desseleccionamos
    if (this.rutaSeleccionada && this.rutaSeleccionada.id === ruta.id) {
      this.mostrarTodasRutas();
      return;
    }

    this.rutaSeleccionada = ruta;

    // Ocultar todas las rutas excepto la seleccionada
    this.rutas.forEach(r => {
      if (r.id !== ruta.id) {
        this.map.setLayoutProperty(r.layerId, 'visibility', 'none');
      } else {
        this.map.setLayoutProperty(r.layerId, 'visibility', 'visible');
      }
    });

    // Actualizar visibilidad de marcadores
    this.marcadores.forEach(marker => {
      const element = marker.getElement();
      element.style.display = 'none';
    });

    this.marcadores
      .filter((_, idx) => idx % this.rutas.length === this.rutas.indexOf(ruta))
      .forEach(marker => {
        const element = marker.getElement();
        element.style.display = 'block';
      });

    // Centrar mapa en la ruta seleccionada
    this.map.fitBounds(ruta.center, {
      padding: 50,
      duration: 800
    });

    // Mostrar popup con info de la ruta
    this.activePopup = new mapboxgl.Popup()
      .setLngLat(ruta.center.getCenter())
      .setHTML(`
        <div class="popup-content">
          <h4>${ruta.nombre}</h4>
          <p>Distancia: ${ruta.popupInfo.distancia}</p>
          <p>Duración estimada: ${ruta.popupInfo.duracion}</p>
          <button id="cerrar-popup" class="cerrar-popup">Cerrar</button>
        </div>
      `)
      .addTo(this.map);

    // Manejar cierre del popup
    setTimeout(() => {
      const cerrarBtn = document.getElementById('cerrar-popup');
      if (cerrarBtn) {
        cerrarBtn.addEventListener('click', () => {
          this.mostrarTodasRutas();
        });
      }
    }, 100);
  }

  mostrarTodasRutas(): void {
    this.rutaSeleccionada = null;

    // Mostrar todas las rutas
    this.rutas.forEach(r => {
      this.map.setLayoutProperty(r.layerId, 'visibility', 'visible');
    });

    // Mostrar todos los marcadores
    this.marcadores.forEach(marker => {
      const element = marker.getElement();
      element.style.display = 'block';
    });

    // Cerrar popup si existe
    if (this.activePopup) {
      this.activePopup.remove();
      this.activePopup = null;
    }

    // Ajustar el mapa para mostrar todas las rutas
    const bounds = new mapboxgl.LngLatBounds();
    this.rutas.forEach(ruta => {
      bounds.extend(ruta.center);
    });
    this.map.fitBounds(bounds, { padding: 50 });
  }

  resetearMapa(): void {
    if (this.rutaSeleccionada) {
      // Si hay una ruta seleccionada, centrar en ella
      this.map.fitBounds(this.rutaSeleccionada.center, {
        padding: 50,
        duration: 800
      });
    } else {
      // Si no hay ruta seleccionada, mostrar todas
      const bounds = new mapboxgl.LngLatBounds();
      this.rutas.forEach(ruta => {
        bounds.extend(ruta.center);
      });
      this.map.fitBounds(bounds, { padding: 50 });
    }
  }
}
