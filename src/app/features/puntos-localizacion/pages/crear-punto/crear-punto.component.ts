import { Component, AfterViewInit } from '@angular/core';
import mapboxgl from 'mapbox-gl';
import { environment } from '../../../../../environments/environment';
import { PuntosLocalizacionService } from '../../services/puntosLocalizacion.service';
import { PuntoLocalizacion } from '../../../../models/punto-localizacion.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-crear-punto',
  templateUrl: './crear-punto.component.html',
  styleUrls: ['./crear-punto.component.css'],
  standalone: false
})
export class CrearPuntoComponent implements AfterViewInit {
  map!: mapboxgl.Map;
  marker!: mapboxgl.Marker;

  punto: Partial<PuntoLocalizacion> = {
    nombre: '',
    descripcion: '',
    usuarioCreador: '1',
    latitud: 0,
    longitud: 0,
    fechaCreacion: new Date().toISOString(),
  };

  constructor(
    private puntosService: PuntosLocalizacionService,
    private router: Router
  ) {}

  ngAfterViewInit(): void {
    mapboxgl.accessToken = environment.mapbox_key; // Asignar el token de Mapbox
    this.map = new mapboxgl.Map({
      container: 'map-preview',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-3.7038, 40.4168], // Centro en Madrid
      zoom: 10
    });

    this.map.on('click', (event) => {
      const { lng, lat } = event.lngLat;

      // Guardamos las coordenadas
      this.punto.latitud = lat;
      this.punto.longitud = lng;

      // Si ya existe el marcador, lo actualizamos
      if (this.marker) {
        this.marker.setLngLat([lng, lat]);
      } else {
        this.marker = new mapboxgl.Marker({ color: '#d71920' })
          .setLngLat([lng, lat])
          .addTo(this.map);
      }
    });
  }

  async guardarPunto() {
    if (
      this.punto.nombre &&
      this.punto.descripcion &&
      this.punto.usuarioCreador &&
      this.punto.latitud !== undefined &&
      this.punto.longitud !== undefined&&
      this.punto.fechaCreacion
    ) {
      await this.puntosService.crearPunto(this.punto as PuntoLocalizacion);
      this.router.navigate(['/puntos-localizacion']);
    } else {
      alert('Por favor, completa todos los campos y selecciona una ubicación.');
    }
  }
}
