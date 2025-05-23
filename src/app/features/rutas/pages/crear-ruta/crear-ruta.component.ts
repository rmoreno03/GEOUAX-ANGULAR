import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PuntosLocalizacionService } from '../../../puntos-localizacion/services/puntosLocalizacion.service';
import { PuntoLocalizacion } from '../../../../models/punto-localizacion.model';
import { RutasService } from '../../services/rutas.service';
import { environment } from '../../../../../environments/environment';
import mapboxgl from 'mapbox-gl';
import mbxDirections from '@mapbox/mapbox-sdk/services/directions';
import { MessageService } from '../../../../core/services/message.service';
import { Router } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-crear-ruta',
  templateUrl: './crear-ruta.component.html',
  styleUrls: ['./crear-ruta.component.css']
})
export class CrearRutaComponent implements OnInit, AfterViewInit {
  formulario!: FormGroup;
  puntos: PuntoLocalizacion[] = [];
  puntosSeleccionados: PuntoLocalizacion[] = [];
  mostrarMensaje = false;
  mensajeTexto = '';
  tipoMensaje: 'exito' | 'eliminado' | 'warning' = 'exito';

  tiposRuta = [
    { label: 'Conduciendo', value: 'driving', icon: 'fa-solid fa-car' },
    { label: 'Caminando', value: 'walking', icon: 'fa-solid fa-person-walking' },
    { label: 'En bicicleta', value: 'cycling', icon: 'fa-solid fa-bicycle' }
  ];

  map!: mapboxgl.Map;
  lineLayerId = 'ruta-logica';
  directionsClient = mbxDirections({ accessToken: environment.mapbox_key });

  constructor(
    private fb: FormBuilder,
    private puntosService: PuntosLocalizacionService,
    private rutasService: RutasService,
    private mensajeService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.formulario = this.fb.group({
      nombre: [''],
      tipoRuta: ['driving'],
      isPublic: [false]
    });

    this.formulario.get('tipoRuta')?.valueChanges.subscribe(() => {
      setTimeout(() => this.actualizarMapa(), 0);
    });

    const userId = this.puntosService.getUserId();
    if (userId) {
      this.puntosService.cargarPuntosLocalizacionPorUsuario(userId).then(data => {
        this.puntos = data;
      });
    }
  }

  ngAfterViewInit(): void {
    mapboxgl.accessToken = environment.mapbox_key;
    this.map = new mapboxgl.Map({
      container: 'map-preview',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-3.7038, 40.4168],
      zoom: 6
    });
  }

  toggleSeleccion(punto: PuntoLocalizacion) {
    const index = this.puntosSeleccionados.findIndex(p => p.id === punto.id);
    if (index >= 0) {
      this.puntosSeleccionados.splice(index, 1);
    } else {
      this.puntosSeleccionados.push(punto);
    }
    this.actualizarMapa();
  }

  async actualizarMapa() {
    if (!this.map) return;

    const markers = document.getElementsByClassName('mapboxgl-marker');
    while (markers.length > 0) markers[0].remove();

    if (this.map.getLayer(this.lineLayerId)) this.map.removeLayer(this.lineLayerId);
    if (this.map.getSource(this.lineLayerId)) this.map.removeSource(this.lineLayerId);

    this.puntosSeleccionados.forEach(punto => {
      new mapboxgl.Marker({ color: '#d71920' })
        .setLngLat([punto.longitud, punto.latitud])
        .setPopup(new mapboxgl.Popup().setHTML(`<strong>${punto.nombre}</strong><br>${punto.descripcion}`))
        .addTo(this.map);
    });

    if (this.puntosSeleccionados.length >= 2) {
      const waypoints = this.puntosSeleccionados.map(p => ({ coordinates: [p.longitud, p.latitud] }));

      try {
        const tipoRuta = this.formulario.value.tipoRuta?.value || this.formulario.value.tipoRuta || 'driving';
        const response = await this.directionsClient.getDirections({
          profile: tipoRuta,
          waypoints,
          geometries: 'geojson'
        }).send();

        const geojson = response.body.routes[0].geometry;
        this.map.addSource(this.lineLayerId, { type: 'geojson', data: geojson });
        this.map.addLayer({
          id: this.lineLayerId,
          type: 'line',
          source: this.lineLayerId,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#f7941d', 'line-width': 5 }
        });
      } catch (error) {
        console.error('Error al calcular ruta lógica:', error);
      }
    }

    if (this.puntosSeleccionados.length > 0) {
      const ultimo = this.puntosSeleccionados[this.puntosSeleccionados.length - 1];
      this.map.flyTo({ center: [ultimo.longitud, ultimo.latitud], zoom: 12 });
    }
  }

  async guardarRuta() {
    const nombre = this.formulario.value.nombre.trim();
    if (!nombre || this.puntosSeleccionados.length === 0) {
      this.mensajeTexto = 'Debes introducir un nombre y seleccionar al menos un punto.';
      this.tipoMensaje = 'warning';
      this.mostrarMensaje = true;
      setTimeout(() => this.mostrarMensaje = false, 3500);
      return;
    }

    try {
      await this.rutasService.crearRuta({
        nombre,
        puntos: this.puntosSeleccionados.map(p => ({
          ...p,
          fotos: p.fotos ?? []
        })),
        tipoRuta: this.formulario.value.tipoRuta?.value || this.formulario.value.tipoRuta || 'driving',
        isPublic: this.formulario.value.isPublic || false
      });

      this.mensajeService.setMensaje('Ruta guardada correctamente.', 'exito');
      this.formulario.reset({ tipoRuta: 'driving' });
      this.puntosSeleccionados = [];
      this.router.navigate(['/rutas/mis-rutas']);
    } catch (error) {
      // Mostrar popup personalizado con error
      console.error('Error al crear la ruta:', error);
      this.mensajeTexto = 'No se pudo crear la ruta: los puntos seleccionados no permiten generar una ruta válida.';
      this.tipoMensaje = 'warning';
      this.mostrarMensaje = true;

      setTimeout(() => this.mostrarMensaje = false, 4000);
    }
  }


  mostrarPopupPersonalizado(texto: string) {
    this.mensajeTexto = texto;
    this.mostrarMensaje = true;
    setTimeout(() => this.mostrarMensaje = false, 4000);
  }

  estaSeleccionado(punto: PuntoLocalizacion): boolean {
    return this.puntosSeleccionados.some(p => p.id === punto.id);
  }
}
