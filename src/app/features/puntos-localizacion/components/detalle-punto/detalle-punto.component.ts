import { Component, AfterViewInit, Inject, forwardRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PuntosLocalizacionService } from '../../services/puntosLocalizacion.service';
import { PuntoLocalizacion } from '../../../../models/punto-localizacion.model';
import mapboxgl from 'mapbox-gl';
import { environment } from '../../../../../environments/environment';
import { MessageService } from '../../../../core/services/message.service';
import { finalize } from 'rxjs/operators';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Timestamp } from 'firebase/firestore';
import { ImageValidationService, ValidationResult } from '../../services/imageValidator.service';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { forkJoin } from 'rxjs';

@Component({
  standalone: false,
  selector: 'app-detalle-punto',
  templateUrl: './detalle-punto.component.html',
  styleUrls: ['./detalle-punto.component.css']
})
export class DetallePuntoComponent implements AfterViewInit {
  punto?: PuntoLocalizacion;
  puntoOriginal: PuntoLocalizacion | null = null;
  loading = true;
  error = '';
  map!: mapboxgl.Map;
  modoEdicion = false;
  fechaLocal = '';
  mostrarConfirmacion = false;
  mensajeTexto = '';
  mostrarMensaje = false;
  tipoMensaje: 'exito' | 'warning' = 'exito';

  fotosAEliminar: boolean[] = []; // Array para controlar las fotos marcadas para eliminar
  nuevasFotos: string[] = []; // Array para almacenar las URLs de las nuevas fotos
  subiendoFotos = false; // Controla el estado de carga de fotos

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private puntosService: PuntosLocalizacionService,
    private messageService: MessageService,
    private imageValidationService: ImageValidationService,
    @Inject(forwardRef(() => AngularFireStorage)) private storage: AngularFireStorage // Usar forwardRef para romper la dependencia circular
  ) {}

  async ngAfterViewInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      try {
        const punto = await this.puntosService.obtenerPuntoPorId(id);
        this.punto = punto ?? undefined;
        this.puntoOriginal = JSON.parse(JSON.stringify(punto));

        // Inicializar el array de fotos a eliminar
        if (this.punto?.fotos) {
          this.fotosAEliminar = new Array(this.punto.fotos.length).fill(false);
        }

        if (this.punto) {
          this.inicializarMapa();
        }
      } catch (err) {
        this.error = 'No se pudo cargar el punto.';
        console.error('Error al cargar el punto:', err);
      } finally {
        this.loading = false;
      }
    }
  }

  inicializarMapa(): void {
    if (!this.punto) return;

    mapboxgl.accessToken = environment.mapbox_key;

    this.map = new mapboxgl.Map({
      container: 'map-preview',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [this.punto.longitud, this.punto.latitud],
      zoom: 16
    });

    const marker = new mapboxgl.Marker({ color: '#d71920' })
      .setLngLat([this.punto.longitud, this.punto.latitud])
      .addTo(this.map);

    this.map.on('click', (event) => {
      if (!this.modoEdicion || !this.punto) return;
      const { lng, lat } = event.lngLat;
      this.punto.latitud = lat;
      this.punto.longitud = lng;
      marker.setLngLat([lng, lat]);
      this.map.flyTo({ center: [lng, lat], zoom: 14 });
    });
  }

  async eliminar(): Promise<void> {
    this.mostrarConfirmacion = true;
  }

  confirmarEliminacion() {
    if (this.punto?.id) {
      this.puntosService.eliminarPunto(this.punto.id).then(() => {
        this.messageService.setMensaje('Punto eliminado correctamente', 'eliminado');
        this.router.navigate(['/puntos-localizacion']);
      });
    }
    this.mostrarConfirmacion = false;
  }

  cancelarEliminacion() {
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



  toggleEdicion() {
    this.modoEdicion = !this.modoEdicion;

    if (this.punto?.fechaCreacion?.toDate) {
      const fecha = this.punto.fechaCreacion.toDate();
      this.fechaLocal = fecha.toISOString().slice(0, 16);
    }
  }

  cancelarEdicion() {
    this.modoEdicion = false;

    // restablecer el punto a su estado original
    if (this.puntoOriginal) {
      this.punto = JSON.parse(JSON.stringify(this.puntoOriginal));
    }

    // forzar cambio de referencia de fotos para que Angular las pinte de nuevo
    if (this.punto?.fotos) {
      this.punto.fotos = [...this.punto.fotos];
      this.fotosAEliminar = new Array(this.punto.fotos.length).fill(false);
    }

    this.nuevasFotos = [];
  }


  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const files: File[] = Array.from(input.files);

    if (files.length === 0) return;

    this.subiendoFotos = true;
    const uploadPromises: Promise<string>[] = [];

    files.forEach(file => {
      if (!file.type.includes('image/')) {
        console.error(`El archivo ${file.name} no es una imagen`);
        return;
      }

      // Crear un nombre único para la imagen
      const nombreArchivo = `puntos/${this.punto?.id}/fotos/${new Date().getTime()}_${file.name}`;
      const fileRef = this.storage.ref(nombreArchivo);
      const task = this.storage.upload(nombreArchivo, file);

      // Crear una promesa que resuelve con la URL de descarga
      const uploadPromise = new Promise<string>((resolve, reject) => {
        task.snapshotChanges().pipe(
          finalize(() => {
            fileRef.getDownloadURL().subscribe(
              url => {
                resolve(url);
              },
              error => {
                console.error('Error al obtener URL de descarga', error);
                reject(error);
              }
            );
          })
        ).subscribe(
          () => {
            // Progreso de la subida
          },
          error => {
            console.error('Error al subir archivo', error);
            reject(error);
          }
        );
      });

      uploadPromises.push(uploadPromise);
    });

    // Esperar a que todas las fotos se suban
    Promise.all(uploadPromises)
      .then(urls => {
        this.nuevasFotos = urls;

        // Añadir las nuevas fotos al punto
        if (!this.punto!.fotos) {
          this.punto!.fotos = [];
        }
        this.punto!.fotos = [...this.punto!.fotos, ...this.nuevasFotos];

        // Actualizar el array de fotos a eliminar
        this.fotosAEliminar = new Array(this.punto!.fotos.length).fill(false);

        this.subiendoFotos = false;

        // Mostrar mensaje de éxito
        this.mensajeTexto = 'Imágenes subidas correctamente. No olvides guardar los cambios.';
        this.tipoMensaje = 'exito';
        this.mostrarMensaje = true;
        setTimeout(() => this.mostrarMensaje = false, 3500);
      })
      .catch(error => {
        console.error('Error al subir imágenes', error);
        this.subiendoFotos = false;

        // Mostrar mensaje de error
        this.mensajeTexto = 'Error al subir las imágenes.';
        this.tipoMensaje = 'warning';
        this.mostrarMensaje = true;
        setTimeout(() => this.mostrarMensaje = false, 3500);
      });
  }

  async validarImagenes(files: File[]): Promise<ValidationResult[]> {
    const observables = files.map(file =>
      this.imageValidationService.validateImage(file).pipe(
        catchError(() => of({ isValid: false, reason: 'Error en validación' }))
      )
    );

    return await new Promise((resolve, reject) => {
      forkJoin(observables).subscribe({
        next: results => resolve(results),
        error: err => reject(err)
      });
    });
  }


  async guardarCambios(): Promise<void> {
    if (!this.punto?.id) return;

    // Verificar campos obligatorios
    if (!this.punto.nombre?.trim() || !this.punto.descripcion?.trim()) {
      this.mensajeTexto = 'Completa todos los campos obligatorios.';
      this.tipoMensaje = 'warning';
      this.mostrarMensaje = true;
      setTimeout(() => this.mostrarMensaje = false, 3500);
      return;
    }

    // Verificar si hay cambios o fotos marcadas para eliminar
    const haCambiado = JSON.stringify(this.punto) !== JSON.stringify(this.puntoOriginal);
    const hayFotosParaEliminar = this.fotosAEliminar.some(Boolean);

    if (!haCambiado && !hayFotosParaEliminar && this.nuevasFotos.length === 0) {
      this.mensajeTexto = 'No se han realizado cambios.';
      this.tipoMensaje = 'warning';
      this.mostrarMensaje = true;
      setTimeout(() => this.mostrarMensaje = false, 3500);
      return;
    }

    // Si hay subidas de fotos en progreso, esperar
    if (this.subiendoFotos) {
      this.mensajeTexto = 'Espera a que se completen las subidas de imágenes.';
      this.tipoMensaje = 'warning';
      this.mostrarMensaje = true;
      setTimeout(() => this.mostrarMensaje = false, 3500);
      return;
    }

    // 🔍 Validar nuevas imágenes antes de subir
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const files = fileInput?.files ? Array.from(fileInput.files) : [];

    if (files.length > 0) {
      this.subiendoFotos = true;

      try {
        const resultados = await this.validarImagenes(files);
        const bloqueadas = resultados.filter(r => !r.isValid);

        if (bloqueadas.length > 0) {
          const etiquetasBloqueadas = bloqueadas.flatMap(r => r.etiquetasDetectadas || []);
          const etiquetasUnicas = [...new Set(etiquetasBloqueadas)];

          this.mensajeTexto = `Se bloquearon ${bloqueadas.length} imagen${bloqueadas.length > 1 ? 'es' : ''} por contenido no permitido: ${etiquetasUnicas.join(', ')}`;
          this.tipoMensaje = 'warning';
          this.mostrarMensaje = true;
          this.subiendoFotos = false;
          setTimeout(() => this.mostrarMensaje = false, 4500);
          return;
        }
      } catch (error) {
        console.error('Error validando imágenes:', error);
        this.mensajeTexto = 'Error al validar las imágenes. Intenta de nuevo.';
        this.tipoMensaje = 'warning';
        this.mostrarMensaje = true;
        this.subiendoFotos = false;
        setTimeout(() => this.mostrarMensaje = false, 4000);
        return;
      }
    }

    // Eliminar fotos marcadas
    if (hayFotosParaEliminar && this.punto?.fotos) {
      this.punto.fotos = this.punto.fotos.filter((_, i) => !this.fotosAEliminar[i]);
    }

    try {
      await this.puntosService.actualizarPunto(this.punto);
      this.modoEdicion = false;
      this.mensajeTexto = 'Punto actualizado con éxito';
      this.tipoMensaje = 'exito';
      this.mostrarMensaje = true;
      setTimeout(() => this.mostrarMensaje = false, 3500);

      this.puntoOriginal = JSON.parse(JSON.stringify(this.punto));
      if (this.punto?.fotos) {
        this.fotosAEliminar = new Array(this.punto.fotos.length).fill(false);
      }
      this.nuevasFotos = [];

      this.inicializarMapa();
    } catch (err) {
      console.error('Error al actualizar el punto', err);
      this.mensajeTexto = 'Hubo un error al guardar los cambios.';
      this.tipoMensaje = 'warning';
      this.mostrarMensaje = true;
      setTimeout(() => this.mostrarMensaje = false, 3500);
    }
  }
}
