import { Component, AfterViewInit } from '@angular/core';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { environment } from '../../../../../environments/environment';
import { PuntosLocalizacionService } from '../../services/puntosLocalizacion.service';
import { PuntoLocalizacion } from '../../../../models/punto-localizacion.model';
import { Router } from '@angular/router';
import { Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { MessageService } from '../../../../core/services/message.service';
import { ImageValidationService, ValidationResult } from '../../services/imageValidator.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';



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
  validating = false;
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
    private mensajeService: MessageService,
    private imageValidationService: ImageValidationService
  ) {}

  ngAfterViewInit(): void {
    (mapboxgl as any).accessToken = environment.mapbox_key;

    this.map = new mapboxgl.Map({
      container: 'map-preview',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-3.7038, 40.4168],
      zoom: 10
    });

    const geocoder = new MapboxGeocoder({
      accessToken: (mapboxgl as any).accessToken,
      mapboxgl: mapboxgl as any,
      marker: false,
      placeholder: 'Buscar ubicación...',
      zoom: 14
    });

    this.map.addControl(geocoder, 'top-left');

    geocoder.on('result', (e) => {
      const coords = e.result.center;
      this.map.flyTo({ center: coords, zoom: 14 });
    });

    this.map.on('click', (event) => {
      const { lng, lat } = event.lngLat;

      this.punto.latitud = lat;
      this.punto.longitud = lng;

      if (this.marker) {
        this.marker.setLngLat([lng, lat]);
      } else {
        this.marker = new mapboxgl.Marker({ color: '#d71920' })
          .setLngLat([lng, lat])
          .addTo(this.map);
      }
    });
  }


  //metodo para guardar los puntos que pasan por la validacion de ia
  async guardarPunto() {
    if (
      this.punto.nombre &&
      this.punto.descripcion &&
      this.punto.usuarioCreador &&
      this.punto.latitud !== undefined &&
      this.punto.longitud !== undefined
    ) {
      this.uploading = true;
      this.validating = true;

      // validación si hay imágenes
      if (this.selectedFiles.length > 0) {
        try {
          const validationResults = await this.validarImagenes();
          console.log('Resultados de validación:', validationResults);

          const invalidImages = validationResults.filter(result => result && !result.isValid);

          if (invalidImages.length > 0) {
            // diccionario de traducciones para mostrar etiquetas en español
            const etiquetasTraducidas: Record<string, string | null> = {
              'gun': 'arma de fuego',
              'firearm': 'arma de fuego',
              'revolver': 'revólver',
              'pistol': 'pistola',
              'air gun': 'pistola de aire comprimido',
              'gun barrel': 'cañón de arma',
              'trigger': 'gatillo',
              'rifle': 'rifle',
              'machine gun': 'ametralladora',
              'knife': 'cuchillo',
              'blade': 'hoja',
              'bomb': 'bomba',
              'grenade': 'granada',
              'bullet': 'bala',
              'ammunition': 'munición',
              'cocaine': 'cocaína',
              'heroin': 'heroína',
              'marijuana': 'marihuana',
              'syringe': 'jeringuilla',
              'needle': 'aguja',
              'porn': 'contenido sexual',
              'nude': 'desnudo',
              'blood': 'sangre',
              'corpse': 'cadáver',
              'everyday carry': 'arma personal',
              'wood': null,
              'iron': null
            };

            const etiquetasBloqueadas = invalidImages
              .flatMap(img => img.etiquetasDetectadas || [])
              .filter((value, index, self) => self.indexOf(value) === index);

            const etiquetasBloqueadasTraducidas = etiquetasBloqueadas
              .map(e => etiquetasTraducidas[e] || null)
              .filter(e => e);

            const etiquetasTexto = etiquetasBloqueadasTraducidas.length > 0
              ? ` por contener: ${etiquetasBloqueadasTraducidas.join(', ')}.`
              : '.';

            this.mensajeTexto = `Se bloqueó ${invalidImages.length} imagen${invalidImages.length > 1 ? 'es' : ''}${etiquetasTexto}`;
            this.tipoMensaje = 'warning';
            this.mostrarMensaje = true;
            this.uploading = false;
            this.validating = false;
            setTimeout(() => (this.mostrarMensaje = false), 5000);
            return;
          }
        } catch (error) {
          console.error('Error validando imágenes:', error);
          this.mensajeTexto = 'Error al validar las imágenes. Intenta de nuevo.';
          this.tipoMensaje = 'warning';
          this.mostrarMensaje = true;
          this.uploading = false;
          this.validating = false;
          setTimeout(() => (this.mostrarMensaje = false), 4000);
          return;
        }
      }

      this.validating = false;

      // subida de imágenes
      const urls: string[] = [];
      try {
        for (const file of this.selectedFiles) {
          const url = await this.puntosService.subirFoto(file);
          urls.push(url);
        }
      } catch (error) {
        console.error('Error subiendo imágenes:', error);
        this.mensajeTexto = 'No se pudieron subir las fotos. Intenta más tarde.';
        this.tipoMensaje = 'warning';
        this.mostrarMensaje = true;
        this.uploading = false;
        setTimeout(() => (this.mostrarMensaje = false), 4000);
        return;
      }

      this.punto.fotos = urls;

      // guardamos el punto
      try {
        await this.puntosService.crearPunto(this.punto as PuntoLocalizacion);
        this.mensajeService.setMensaje('Punto creado con éxito', 'exito');
        this.router.navigate(['/puntos']);
      } catch (error) {
        console.error('Error guardando punto:', error);
        this.mensajeTexto = 'No se pudo guardar el punto. Intenta de nuevo.';
        this.tipoMensaje = 'warning';
        this.mostrarMensaje = true;
        setTimeout(() => (this.mostrarMensaje = false), 4000);
      }
    } else {
      this.mensajeTexto = 'Faltan campos por completar o no se seleccionó ubicación.';
      this.tipoMensaje = 'warning';
      this.mostrarMensaje = true;
      setTimeout(() => (this.mostrarMensaje = false), 3000);
    }

    this.uploading = false;
  }


  /**
   * Valida todas las imágenes seleccionadas
   * @returns Promise con un array de resultados de validación
   */
  async validarImagenes(): Promise<ValidationResult[]> {
    if (this.selectedFiles.length === 0) {
      return [];
    }

    console.log(`Iniciando validación de ${this.selectedFiles.length} imágenes`);

    // Mostrar información de cada archivo para depuración
    this.selectedFiles.forEach((file, index) => {
      console.log(`Archivo ${index+1}:`, {
        nombre: file.name,
        tipo: file.type,
        tamaño: `${(file.size / 1024).toFixed(2)} KB`
      });
    });

    // Convertimos los observables de validación a promesas
    const validationObservables = this.selectedFiles.map(file =>
      this.imageValidationService.validateImage(file).pipe(
        catchError(error => {
          console.error('Error validando imagen:', error);
          // Si es un HttpErrorResponse, mostrar más detalles
          if (error.name === 'HttpErrorResponse') {
            console.error('Status:', error.status);
            console.error('Mensaje:', error.message);
            if (error.error) {
              console.error('Detalle del error:', error.error);
            }
          }
          return of({ isValid: false, reason: 'Error en la validación' });
        })
      )
    );

    // Esperamos a que todas las validaciones terminen
    return await new Promise((resolve, reject) => {
      forkJoin(validationObservables).subscribe({
        next: results => {
          console.log('Resultados de validación:', results);
          resolve(results);
        },
        error: err => {
          console.error('Error en forkJoin:', err);
          reject(err);
        }
      });
    });
  }

  onFotosSeleccionadas(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    this.selectedFiles = Array.from(input.files);
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
