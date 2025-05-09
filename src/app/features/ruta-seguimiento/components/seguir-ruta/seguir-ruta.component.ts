import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RutasService } from '../../../rutas/services/rutas.service';
import { ProgresoRutaService } from '../../services/progreso-ruta.service';
import { Ruta } from '../../../../models/ruta.model';
import { ProgresoRuta } from '../../../../models/progreso-ruta.model';
import { PuntoLocalizacion } from '../../../../models/punto-localizacion.model';
import { environment } from '../../../../../environments/environment';
import mapboxgl from 'mapbox-gl';
import mbxDirections from '@mapbox/mapbox-sdk/services/directions';
import { Timestamp } from '@angular/fire/firestore';
import { Subscription, interval } from 'rxjs';
import { takeWhile } from 'rxjs/operators';

@Component({
  standalone: false,
  selector: 'app-seguir-ruta',
  templateUrl: './seguir-ruta.component.html',
  styleUrls: ['./seguir-ruta.component.css']
})
export class SeguirRutaComponent implements OnInit, OnDestroy {

  ruta: Ruta | null = null;
  map!: mapboxgl.Map;
  directionsClient = mbxDirections({ accessToken: environment.mapbox_key });
  markers: mapboxgl.Marker[] = [];
  userLocationMarker: mapboxgl.Marker | null = null;
  watchPositionId: number | null = null;
  currentUserPosition: { lat: number, lng: number } | null = null;

  // Variables para el progreso
  progresoRuta: ProgresoRuta | null = null;
  progresoId: string | null = null;

  // Punto actual que se debe alcanzar
  puntoActualIndex = 0;
  distanciaAlPuntoActual = 0;
  siguiendoRuta = false;

  // Mensaje
  mostrarMensaje = false;
  mensajeTexto = '';
  tipoMensaje: 'exito' | 'eliminado' | 'warning' = 'exito';

  // Para el modal de confirmación de punto
  mostrarConfirmacionPunto = false;
  puntoAConfirmar: PuntoLocalizacion | null = null;

  // Subscripciones
  private locationSubscription: Subscription | null = null;
  private routeSubscription: Subscription | null = null;

  // Para acceder a Math en el template
  Math = Math;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rutasService: RutasService,
    private progresoRutaService: ProgresoRutaService,
    private ngZone: NgZone
  ) {}

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/rutas/mis-rutas']);
      return;
    }

    try {
      this.ruta = await this.rutasService.obtenerRutaPorId(id);

      if (!this.ruta) {
        this.mostrarMensajeError('No se encontró la ruta solicitada');
        this.router.navigate(['/rutas/mis-rutas']);
        return;
      }

      // Registrar visita a la ruta
      if (this.ruta.id) {
        this.rutasService.incrementarVisitas(this.ruta.id);
      }

      // Inicializar el objeto de progreso
      await this.inicializarProgresoRuta();

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

  ngOnDestroy(): void {
    // Detener el seguimiento de ubicación
    this.detenerSeguimientoUbicacion();

    // Limpiar suscripciones
    if (this.locationSubscription) {
      this.locationSubscription.unsubscribe();
    }

    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  async inicializarProgresoRuta(): Promise<void> {
    if (!this.ruta || !this.ruta.id) return;

    try {
      // Intentar obtener un progreso existente
      const progresoExistente = await this.progresoRutaService.obtenerProgresoRuta(this.ruta.id);

      if (progresoExistente) {
        // Si ya existe un progreso, usarlo
        this.progresoRuta = progresoExistente;
        this.progresoId = progresoExistente.id || null;

        // Determinar el punto actual (el primer punto no completado)
        this.puntoActualIndex = this.determinarPuntoActual();

        // Si la ruta ya está completada
        if (progresoExistente.completado) {
          this.mostrarMensajeInfo('Esta ruta ya ha sido completada anteriormente');
        }
      } else {
        // Si no existe, inicializar uno nuevo
        const puntosCompletados: Record<string, boolean> = {};
        this.ruta.puntos.forEach(punto => {
          puntosCompletados[punto.id] = false;
        });

        this.progresoRuta = {
          rutaId: this.ruta.id,
          usuarioId: this.progresoRutaService.getUserId() || 'anonimo',
          completado: false,
          puntosCompletados,
          fechaInicio: null,
          fechaUltimaActividad: null,
          fechaFin: null
        };

        this.puntoActualIndex = 0;
      }
    } catch (error) {
      console.error('Error al inicializar progreso de ruta:', error);
      // Inicializar con valores por defecto en caso de error
      if (this.ruta) {
        const puntosCompletados: Record<string, boolean> = {};
        this.ruta.puntos.forEach(punto => {
          puntosCompletados[punto.id] = false;
        });

        this.progresoRuta = {
          rutaId: this.ruta.id,
          usuarioId: this.progresoRutaService.getUserId() || 'anonimo',
          completado: false,
          puntosCompletados,
          fechaInicio: null,
          fechaUltimaActividad: null,
          fechaFin: null
        };
      }

      this.puntoActualIndex = 0;
    }
  }

  determinarPuntoActual(): number {
    if (!this.ruta || !this.progresoRuta) return 0;

    for (let i = 0; i < this.ruta.puntos.length; i++) {
      const punto = this.ruta.puntos[i];
      if (!this.progresoRuta.puntosCompletados[punto.id]) {
        return i;
      }
    }

    // Si todos los puntos están completados, devolver el último índice
    return this.ruta.puntos.length - 1;
  }

  inicializarMapa(): void {
    if (!this.ruta) return;

    mapboxgl.accessToken = environment.mapbox_key;

    this.map = new mapboxgl.Map({
      container: 'map-seguimiento',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-3.7038, 40.4168], // Default center (Madrid)
      zoom: 15
    });

    this.map.on('load', async () => {
      await this.dibujarRuta();
      this.agregarMarcadores();

      // Añadir controles
      this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      this.map.addControl(new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: false
      }), 'top-right');

      // Centrar en el primer punto de la ruta
      this.centrarEnPuntoActual();
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
    if (!this.ruta || !this.map || !this.progresoRuta) return;

    // Limpiar marcadores anteriores
    this.markers.forEach(marker => marker.remove());
    this.markers = [];

    // Añadir marcadores para cada punto
    this.ruta.puntos.forEach((punto, index) => {
      // Crear elemento personalizado para el marcador
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.width = '40px';
      el.style.height = '40px';
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

      // Añadir indicador de completado
      if (this.progresoRuta && this.progresoRuta.puntosCompletados[punto.id]) {
        // Si el punto está completado, mostrar un check
        el.innerHTML = '<i class="fas fa-check"></i>';
      } else {
        // Si no está completado, mostrar el número
        el.innerHTML = (index + 1).toString();
      }

      // Crear popup
      const popup = new mapboxgl.Popup({ offset: 30 })
        .setHTML(`
          <h3 style="margin:0;font-size:14px;font-weight:600;color:#333">${punto.nombre}</h3>
          <p style="margin:5px 0 0;font-size:12px;color:#666">${punto.descripcion}</p>
          ${this.progresoRuta?.puntosCompletados[punto.id]
            ? '<p style="color:#4CAF50;margin:5px 0 0;font-weight:bold"><i class="fas fa-check-circle"></i> Punto completado</p>'
            : '<p style="color:#f7941d;margin:5px 0 0"><i class="fas fa-map-marker-alt"></i> Punto pendiente</p>'}
        `);

      // Crear y añadir marcador
      const marker = new mapboxgl.Marker(el)
        .setLngLat([punto.longitud, punto.latitud])
        .setPopup(popup)
        .addTo(this.map);

      // Asociar evento click
      marker.getElement().addEventListener('click', () => {
        this.seleccionarPunto(punto, index);
      });

      this.markers.push(marker);
    });
  }

  seleccionarPunto(punto: PuntoLocalizacion, index: number): void {
    // Centrar mapa en el punto seleccionado
    if (this.map) {
      this.map.flyTo({
        center: [punto.longitud, punto.latitud],
        zoom: 15,
        speed: 1.2,
        curve: 1.5
      });
    }

    // Si estamos en modo seguimiento y el punto seleccionado es el actual
    if (this.siguiendoRuta && index === this.puntoActualIndex) {
      // Verificar distancia actual al punto
      if (this.currentUserPosition && this.distanciaAlPuntoActual <= 50) {
        // Estamos lo suficientemente cerca para marcar el punto
        this.confirmarPunto(punto);
      } else {
        this.mostrarMensajeInfo('Dirígete a este punto para marcarlo como completado');
      }
    }
  }

  confirmarPunto(punto: PuntoLocalizacion): void {
    this.puntoAConfirmar = punto;
    this.mostrarConfirmacionPunto = true;
  }

  async marcarPuntoCompletado(): Promise<void> {
    if (!this.puntoAConfirmar || !this.ruta?.id || !this.progresoRuta) return;

    try {
      // Obtener el progreso existente
      const progresoExistente = await this.progresoRutaService.obtenerProgresoRuta(this.ruta.id);

      // Si no existe un progreso, crear uno nuevo
      if (!progresoExistente || !progresoExistente.id) {
        // Crear progreso en Firestore
        const puntosIds = this.ruta.puntos.map(punto => punto.id);
        this.progresoId = await this.progresoRutaService.crearProgresoRuta(this.ruta.id, puntosIds);

        // Actualizar progreso local
        if (this.progresoId) {
          this.progresoRuta.id = this.progresoId;
          this.progresoRuta.fechaInicio = Timestamp.now();
          this.progresoRuta.fechaUltimaActividad = Timestamp.now();
        }
      } else {
        this.progresoId = progresoExistente.id;
      }

      if (this.progresoId) {
        // Marcar el punto como completado en Firestore
        await this.progresoRutaService.marcarPuntoCompletado(this.progresoId, this.puntoAConfirmar.id);

        // Actualizar el estado local
        this.progresoRuta.puntosCompletados[this.puntoAConfirmar.id] = true;

        // Si es el primer punto y recién iniciamos la ruta
        if (this.puntoActualIndex === 0 && !this.progresoRuta.fechaInicio) {
          this.progresoRuta.fechaInicio = Timestamp.now();
        }

        // Avanzar al siguiente punto
        this.puntoActualIndex++;

        // 🔄 Recalcular distancia al nuevo punto
        this.calcularDistanciaAlPuntoActual();

        // Comprobar si hemos completado todos los puntos
        if (this.puntoActualIndex >= (this.ruta?.puntos.length || 0)) {
          await this.completarRuta();
        } else {
          // Actualizar marcadores para reflejar el progreso
          this.actualizarMarcadores();

          // Centrar en el siguiente punto
          this.centrarEnPuntoActual();

          this.mostrarMensajeExito(`¡Punto ${this.puntoAConfirmar.nombre} completado! Dirígete al siguiente punto.`);
        }
      } else {
        throw new Error('No se pudo crear o encontrar el progreso de la ruta');
      }
    } catch (error) {
      console.error('Error al marcar punto completado:', error);
      this.mostrarMensajeError('No se pudo marcar el punto como completado.');
    }

    this.mostrarConfirmacionPunto = false;
    this.puntoAConfirmar = null;
  }


  cancelarConfirmacionPunto(): void {
    this.mostrarConfirmacionPunto = false;
    this.puntoAConfirmar = null;
  }

  actualizarMarcadores(): void {
    // Volver a dibujar los marcadores para reflejar cuáles están completados
    this.agregarMarcadores();
  }

  async completarRuta(): Promise<void> {
    if (!this.ruta?.id || !this.progresoId || !this.progresoRuta) return;

    try {
      // Actualizar el estado en Firestore
      await this.progresoRutaService.actualizarProgresoRuta(this.progresoId, {
        completado: true,
        fechaFin: Timestamp.now()
      });

      // Actualizar el estado local
      this.progresoRuta.completado = true;
      this.progresoRuta.fechaFin = Timestamp.now();
      this.siguiendoRuta = false;

      // Detener seguimiento de ubicación
      this.detenerSeguimientoUbicacion();

      // Mostrar mensaje de éxito
      this.mostrarMensajeExito('¡Enhorabuena! Has completado la ruta con éxito.');

      // Actualizar visualización de marcadores
      this.actualizarMarcadores();

      // Centrar el mapa para mostrar toda la ruta completada
      this.centrarRutaCompleta();
    } catch (error) {
      console.error('Error al completar ruta:', error);
      this.mostrarMensajeError('No se pudo marcar la ruta como completada.');
    }
  }

  async iniciarSeguimientoRuta(): Promise<void> {
    if (this.siguiendoRuta) return;

    // Comprobar si el navegador soporta geolocalización
    if (!navigator.geolocation) {
      this.mostrarMensajeError('Tu navegador no soporta geolocalización.');
      return;
    }

    // Iniciar seguimiento
    this.siguiendoRuta = true;
    this.mostrarMensajeInfo('Iniciando seguimiento de ruta...');

    try {
      // Si aún no hay un progreso guardado, crearlo ahora
      if (!this.progresoId && this.ruta?.id && this.progresoRuta && !this.progresoRuta.fechaInicio) {
        this.progresoRuta.fechaInicio = Timestamp.now();
        this.progresoRuta.fechaUltimaActividad = Timestamp.now();

        // Crear progreso en Firestore
        const puntosIds = this.ruta.puntos.map(punto => punto.id);
        this.progresoId = await this.progresoRutaService.crearProgresoRuta(this.ruta.id, puntosIds);
      }

      // Obtener ubicación inicial
      this.obtenerUbicacionActual();

      // Iniciar seguimiento continuo
      this.watchPositionId = navigator.geolocation.watchPosition(
        (position) => {
          this.ngZone.run(() => {
            this.actualizarPosicionUsuario(position.coords.latitude, position.coords.longitude);
          });
        },
        (error) => {
          this.ngZone.run(() => {
            console.error('Error al obtener ubicación:', error);
            this.mostrarMensajeError('Error al obtener tu ubicación. Verifica los permisos de geolocalización.');
            this.detenerSeguimientoUbicacion();
          });
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000
        }
      );

      // Comprobar periódicamente la cercanía al punto actual
      this.locationSubscription = interval(5000).pipe(
        takeWhile(() => this.siguiendoRuta)
      ).subscribe(() => {
        this.comprobarCercaniaAlPunto();
      });

    } catch (error) {
      console.error('Error al iniciar seguimiento:', error);
      this.mostrarMensajeError('Ocurrió un error al iniciar el seguimiento de la ruta.');
      this.siguiendoRuta = false;
    }
  }

  detenerSeguimientoRuta(): void {
    this.siguiendoRuta = false;
    this.detenerSeguimientoUbicacion();
    this.mostrarMensajeInfo('Seguimiento de ruta detenido.');
  }

  detenerSeguimientoUbicacion(): void {
    if (this.watchPositionId !== null) {
      navigator.geolocation.clearWatch(this.watchPositionId);
      this.watchPositionId = null;
    }

    if (this.userLocationMarker) {
      this.userLocationMarker.remove();
      this.userLocationMarker = null;
    }

    if (this.locationSubscription) {
      this.locationSubscription.unsubscribe();
      this.locationSubscription = null;
    }
  }

  obtenerUbicacionActual(): void {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.ngZone.run(() => {
          this.actualizarPosicionUsuario(position.coords.latitude, position.coords.longitude);

          // Decidir si centramos en la ubicación del usuario o en el primer punto
          if (this.ruta && this.progresoRuta && this.puntoActualIndex === 0 && !this.progresoRuta.puntosCompletados[this.ruta.puntos[0].id]) {
            this.centrarEnPuntoActual();
          } else {
            this.centrarEnUsuario();
          }
        });
      },
      (error) => {
        this.ngZone.run(() => {
          console.error('Error al obtener ubicación inicial:', error);
          this.mostrarMensajeError('No se pudo obtener tu ubicación actual. Verifica los permisos de geolocalización.');
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  actualizarPosicionUsuario(lat: number, lng: number): void {
    if (!this.map) return;

    this.currentUserPosition = { lat, lng };

    // Actualizar o crear marcador de ubicación del usuario
    if (!this.userLocationMarker) {
      // Crear elemento para el marcador
      const el = document.createElement('div');
      el.className = 'user-location-marker';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#3498db';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';

      // Añadir pulso
      const pulse = document.createElement('div');
      pulse.className = 'pulse';
      el.appendChild(pulse);

      this.userLocationMarker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .addTo(this.map);
    } else {
      this.userLocationMarker.setLngLat([lng, lat]);
    }

    // Calcular distancia al punto actual
    this.calcularDistanciaAlPuntoActual();
  }

  calcularDistanciaAlPuntoActual(): void {
    if (!this.ruta || !this.currentUserPosition || this.puntoActualIndex >= this.ruta.puntos.length) return;

    const puntoActual = this.ruta.puntos[this.puntoActualIndex];

    // Calcular distancia usando la fórmula de Haversine
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = this.toRad(puntoActual.latitud - this.currentUserPosition.lat);
    const dLon = this.toRad(puntoActual.longitud - this.currentUserPosition.lng);

    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRad(this.currentUserPosition.lat)) * Math.cos(this.toRad(puntoActual.latitud)) *
      Math.sin(dLon/2) * Math.sin(dLon/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distancia = R * c; // Distancia en metros

    this.distanciaAlPuntoActual = distancia;
  }

  // Función auxiliar para convertir a radianes
  toRad(value: number): number {
    return value * Math.PI / 180;
  }

  comprobarCercaniaAlPunto(): void {
    if (!this.siguiendoRuta || !this.ruta || this.puntoActualIndex >= this.ruta.puntos.length) return;

    // No repetir la confirmación si ya hay una activa
    if (this.mostrarConfirmacionPunto) return;

    const puntoActual = this.ruta.puntos[this.puntoActualIndex];

    // Si ya está completado, no volver a confirmar
    if (this.progresoRuta?.puntosCompletados[puntoActual.id]) return;

    // Si estamos lo suficientemente cerca del punto actual (50 metros)
    if (this.distanciaAlPuntoActual <= 50) {
      this.confirmarPunto(puntoActual);
    }
  }




  centrarEnPuntoActual(): void {
    if (!this.map || !this.ruta || this.puntoActualIndex >= this.ruta.puntos.length) return;

    const punto = this.ruta.puntos[this.puntoActualIndex];

    this.map.flyTo({
      center: [punto.longitud, punto.latitud],
      zoom: 15,
      speed: 1.2,
      curve: 1.5
    });
  }

  centrarEnUsuario(): void {
    if (!this.map || !this.currentUserPosition) return;

    this.map.flyTo({
      center: [this.currentUserPosition.lng, this.currentUserPosition.lat],
      zoom: 15,
      speed: 1.2,
      curve: 1.5
    });
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

  getIconoRuta(tipo: string | null | undefined): string {
    // Si tipo es null o undefined, usar valor por defecto
    if (!tipo) {
      return 'fa-solid fa-route';
    }

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

  getColorRuta(tipo: string | null | undefined): string {
    // Si tipo es null o undefined, usar valor por defecto
    if (!tipo) {
      return '#d71920';
    }

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

  formatFecha(fecha: Timestamp | Date | string | null): string {
    if (!fecha) return '';

    let date: Date;

    if (fecha instanceof Date) {
      date = fecha;
    } else if (typeof fecha === 'string') {
      date = new Date(fecha);
    } else if (fecha && (fecha as Timestamp).toDate) {
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

  formatDuracion(minutos: number): string {
    if (!minutos) return '0 min';

    if (minutos < 60) {
      return `${Math.round(minutos)} min`;
    }

    const horas = Math.floor(minutos / 60);
    const mins = Math.round(minutos % 60);

    if (mins === 0) return `${horas} h`;

    return `${horas} h ${mins} min`;
  }

  calcularProgreso(): number {
    if (!this.ruta || !this.progresoRuta) return 0;

    const totalPuntos = this.ruta.puntos.length;
    if (totalPuntos === 0) return 0;

    let completados = 0;

    for (const punto of this.ruta.puntos) {
      if (this.progresoRuta.puntosCompletados[punto.id]) {
        completados++;
      }
    }

    return Math.round((completados / totalPuntos) * 100);
  }

  /**
   * Calcula el tiempo transcurrido entre el inicio y fin de la ruta
   * y lo devuelve en formato legible
   */
  calcularTiempoTranscurrido(): string {
    if (!this.progresoRuta?.fechaInicio || !this.progresoRuta?.fechaFin) {
      return 'N/A';
    }

    try {
      const tiempoInicio = this.progresoRuta.fechaInicio.toMillis();
      const tiempoFin = this.progresoRuta.fechaFin.toMillis();

      // Calcular la diferencia en minutos
      const diferenciaMinutos = (tiempoFin - tiempoInicio) / 60000;

      return this.formatDuracion(diferenciaMinutos);
    } catch (error) {
      console.error('Error al calcular tiempo transcurrido:', error);
      return 'N/A';
    }
  }

  volverAListado(): void {
    this.router.navigate(['/rutas/mis-rutas']);
  }

  mostrarMensajeExito(mensaje: string): void {
    this.mensajeTexto = mensaje;
    this.tipoMensaje = 'exito';
    this.mostrarMensaje = true;

    setTimeout(() => {
      this.mostrarMensaje = false;
    }, 3500);
  }

  mostrarMensajeError(mensaje: string): void {
    this.mensajeTexto = mensaje;
    this.tipoMensaje = 'warning';
    this.mostrarMensaje = true;

    setTimeout(() => {
      this.mostrarMensaje = false;
    }, 3500);
  }

  mostrarMensajeInfo(mensaje: string): void {
    this.mensajeTexto = mensaje;
    this.tipoMensaje = 'warning';  // Usando 'warning' ya que no tenemos 'info'
    this.mostrarMensaje = true;

    setTimeout(() => {
      this.mostrarMensaje = false;
    }, 3500);
  }

}

