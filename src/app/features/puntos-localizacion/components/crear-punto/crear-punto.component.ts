import { Component, AfterViewInit } from '@angular/core';
import mapboxgl from 'mapbox-gl';
import { environment } from '../../../../../environments/environment';
import { PuntosLocalizacionService } from '../../services/puntosLocalizacion.service';
import { PuntoLocalizacion } from '../../../../models/punto-localizacion.model';
import { Router } from '@angular/router';
import { Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { MessageService } from '../../../../core/services/message.service';

@Component({
  selector: 'app-crear-punto',
  templateUrl: './crear-punto.component.html',
  styleUrls: ['./crear-punto.component.css'],
  standalone: false
})
export class CrearPuntoComponent implements AfterViewInit {
  map!: mapboxgl.Map;
  marker!: mapboxgl.Marker;
  selectedFiles: File[] = [];
  previewUrls: string[] = [];
  uploading = false;
  mostrarMensaje = false;
  mensajeTexto = '';
  tipoMensaje: 'exito' | 'eliminado' | 'warning' = 'exito';

  private auth = getAuth();
  private user = this.auth.currentUser;
  private uid = this.user?.uid;


  punto: Partial<PuntoLocalizacion> = {
    nombre: '',
    descripcion: '',
    usuarioCreador: this.uid,
    latitud: 0,
    longitud: 0,
    fechaCreacion: Timestamp.now(),
    fotos: []
  };

  constructor(
    private puntosService: PuntosLocalizacionService,
    private router: Router,
    private mensajeService: MessageService
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
      this.punto.longitud !== undefined
    ) {
      this.uploading = true;
      const urls: string[] = [];

      for (const file of this.selectedFiles) {
        const url = await this.puntosService.subirFoto(file);
        urls.push(url);
      }

      this.punto.fotos = urls;

      await this.puntosService.crearPunto(this.punto as PuntoLocalizacion);
      this.mensajeService.setMensaje('Punto creado con éxito!', 'exito');
      this.router.navigate(['/puntos-localizacion']);
    } else {
      this.mensajeTexto = 'Por favor, completa todos los campos y selecciona una ubicación.';
      this.tipoMensaje = 'warning';
      this.mostrarMensaje = true;
      setTimeout(() => (this.mostrarMensaje = false), 3500);
    }

    this.uploading = false;
  }

  onFotosSeleccionadas(event: any): void {
    this.selectedFiles = Array.from(event.target.files);
    this.previewUrls = [];

    this.selectedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          this.previewUrls.push(reader.result);
        }
      };
      reader.readAsDataURL(file);
    });
  }
}
