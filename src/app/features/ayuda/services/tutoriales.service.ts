import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Tutorial } from '../../../models/tutorial.model';
  import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TutorialesService {

  // Datos de ejemplo para desarrollo (se eliminará en producción)
  private tutorialesEjemplo: Tutorial[] = [
    {
      id: '1',
      titulo: 'Cómo crear tu primera ruta',
      descripcion: 'Aprende a crear una ruta personalizada en GeoUAX paso a paso. Este tutorial cubre desde cómo acceder al mapa hasta cómo guardar y compartir tu ruta.',
      categoria: 'basicos',
      nivel: 'básico',
      duracion: '5 min',
      imagenUrl: 'assets/img/tutoriales/crear-ruta.jpg',
      fecha: new Date('2025-04-10'),
      visitas: 1250,
      pasos: [
        {
          titulo: 'Accede a la sección de rutas',
          descripcion: 'Desde el menú principal, selecciona la opción "Rutas" para acceder al mapa interactivo.',
          imagen: 'assets/img/tutoriales/paso1-rutas.jpg'
        },
        {
          titulo: 'Haz clic en "Crear ruta"',
          descripcion: 'En la parte superior derecha, encontrarás el botón "Crear ruta". Haz clic en él para comenzar.',
          imagen: 'assets/img/tutoriales/paso2-crear.jpg'
        },
        {
          titulo: 'Marca los puntos en el mapa',
          descripcion: 'Haz clic en el mapa para crear los puntos que formarán tu ruta. Puedes ajustar los puntos arrastrándolos.',
          imagen: 'assets/img/tutoriales/paso3-puntos.jpg'
        },
        {
          titulo: 'Configura las opciones',
          descripcion: 'Establece un nombre, descripción y privacidad para tu ruta. También puedes añadir etiquetas para facilitar su búsqueda.',
          imagen: 'assets/img/tutoriales/paso4-opciones.jpg'
        },
        {
          titulo: 'Guarda tu ruta',
          descripcion: 'Haz clic en "Guardar" para finalizar. ¡Ya tienes tu primera ruta creada!',
          imagen: 'assets/img/tutoriales/paso5-guardar.jpg'
        }
      ],
      consejos: [
        'Utiliza el zoom para mayor precisión al marcar puntos',
        'Si te equivocas, puedes eliminar un punto haciendo clic derecho sobre él',
        'Las rutas privadas solo son visibles para ti'
      ]
    },
    {
      id: '2',
      titulo: 'Compartir rutas en redes sociales',
      descripcion: 'Descubre cómo compartir tus rutas favoritas en diferentes redes sociales para que tus amigos puedan disfrutarlas.',
      categoria: 'social',
      nivel: 'intermedio',
      duracion: '3 min',
      imagenUrl: 'assets/img/tutoriales/compartir-social.jpg',
      fecha: new Date('2025-04-15'),
      visitas: 875,
      pasos: [
        {
          titulo: 'Abre la ruta que quieres compartir',
          descripcion: 'Accede a la ruta que deseas compartir desde tu lista de rutas o buscándola en el explorador.',
          imagen: 'assets/img/tutoriales/social-paso1.jpg'
        },
        {
          titulo: 'Haz clic en el botón "Compartir"',
          descripcion: 'En la pantalla de detalles de la ruta, busca el botón con el icono de compartir.',
          imagen: 'assets/img/tutoriales/social-paso2.jpg'
        },
        {
          titulo: 'Selecciona la red social',
          descripcion: 'Elige en qué red social quieres compartir la ruta (Facebook, Twitter, Instagram, WhatsApp).',
          imagen: 'assets/img/tutoriales/social-paso3.jpg'
        },
        {
          titulo: 'Personaliza tu publicación',
          descripcion: 'Añade un comentario personal a tu publicación para que tus amigos sepan por qué les compartes esta ruta.',
          imagen: 'assets/img/tutoriales/social-paso4.jpg'
        }
      ],
      consejos: [
        'Las rutas privadas no se pueden compartir',
        'Puedes programar publicaciones para más tarde',
        'Usa hashtags para aumentar la visibilidad'
      ],
      videoUrl: 'https://youtu.be/example-video-id'
    },
    {
      id: '3',
      titulo: 'Configurar tu perfil de usuario',
      descripcion: 'Personaliza tu perfil en GeoUAX con tu información personal, preferencias y foto para que otros usuarios puedan conocerte mejor.',
      categoria: 'basicos',
      nivel: 'básico',
      duracion: '4 min',
      imagenUrl: 'assets/img/tutoriales/perfil-usuario.jpg',
      fecha: new Date('2025-04-20'),
      visitas: 950,
      pasos: [
        {
          titulo: 'Accede a tu perfil',
          descripcion: 'Haz clic en tu foto de perfil en la esquina superior derecha y selecciona "Mi perfil".',
          imagen: 'assets/img/tutoriales/perfil-paso1.jpg'
        },
        {
          titulo: 'Haz clic en "Editar perfil"',
          descripcion: 'Encontrarás este botón en la parte superior de tu perfil.',
          imagen: 'assets/img/tutoriales/perfil-paso2.jpg'
        },
        {
          titulo: 'Actualiza tu información',
          descripcion: 'Rellena los campos con tu información personal, intereses y experiencia en senderismo o ciclismo.',
          imagen: 'assets/img/tutoriales/perfil-paso3.jpg'
        },
        {
          titulo: 'Cambia tu foto de perfil',
          descripcion: 'Haz clic en el icono de la cámara sobre tu foto actual para subir una nueva imagen.',
          imagen: 'assets/img/tutoriales/perfil-paso4.jpg'
        },
        {
          titulo: 'Guarda los cambios',
          descripcion: 'No olvides hacer clic en "Guardar cambios" cuando hayas terminado de editar tu perfil.',
          imagen: 'assets/img/tutoriales/perfil-paso5.jpg'
        }
      ]
    }
    // Puedes añadir más tutoriales de ejemplo aquí
  ];

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todos los tutoriales
   */
  getTutoriales(): Observable<Tutorial[]> {
    // En producción, utilizar esto:
    // return this.http.get<Tutorial[]>(this.apiUrl)
    //   .pipe(
    //     catchError(this.handleError<Tutorial[]>('getTutoriales', []))
    //   );

    // Para desarrollo, usar datos de ejemplo:
    return of(this.tutorialesEjemplo);
  }

  /**
   * Obtiene un tutorial por su ID
   * @param id ID del tutorial
   */
  getTutorial(id: string): Observable<Tutorial> {
    // En producción, utilizar esto:
    // const url = `${this.apiUrl}/${id}`;
    // return this.http.get<Tutorial>(url)
    //   .pipe(
    //     catchError(this.handleError<Tutorial>(`getTutorial id=${id}`))
    //   );

    // Para desarrollo, usar datos de ejemplo:
    const tutorial = this.tutorialesEjemplo.find(tutorial => tutorial.id === id);
    if (!tutorial) {
      throw new Error(`Tutorial with ID ${id} not found`);
    }
    return of(tutorial);
  }

  /**
   * Incrementa el contador de visitas de un tutorial
   * @param id ID del tutorial
   */
  incrementarVisitas(id: string): Observable<any> {
    // En producción, utilizar esto:
    // const url = `${this.apiUrl}/${id}/incrementar-visitas`;
    // return this.http.post<any>(url, {})
    //   .pipe(
    //     catchError(this.handleError<any>('incrementarVisitas'))
    //   );

    // Para desarrollo, simular incremento:
    const tutorial = this.tutorialesEjemplo.find(t => t.id === id);
    if (tutorial && tutorial.visitas !== undefined) {
      tutorial.visitas += 1;
    }
    return of({ success: true });
  }

  /**
   * Descarga un tutorial en formato PDF
   * @param id ID del tutorial
   */
  descargarPDF(id: string): Observable<Blob> {
    // En producción, utilizar esto:
    // const url = `${this.apiUrl}/${id}/pdf`;
    // return this.http.get(url, { responseType: 'blob' })
    //   .pipe(
    //     catchError(this.handleError<Blob>('descargarPDF'))
    //   );

    // Para desarrollo, simular descarga:
    // Creamos un PDF vacío para el ejemplo
    const pdfContent = new Blob(['Contenido del PDF'], { type: 'application/pdf' });
    return of(pdfContent);
  }

  /**
   * Suscribe al usuario al newsletter de tutoriales
   * @param email Email del usuario
   */
  suscribirNewsletter(email: string): Observable<any> {
    // En producción, utilizar esto:
    // const url = `${this.apiUrl}/newsletter/suscribir`;
    // return this.http.post<any>(url, { email })
    //   .pipe(
    //     catchError(this.handleError<any>('suscribirNewsletter'))
    //   );

    // Para desarrollo, simular suscripción:
    console.log(`Suscripción simulada para: ${email}`);
    return of({ success: true });
  }

  /**
   * Maneja los errores HTTP
   * @param operation Nombre de la operación que falló
   * @param result Valor opcional para devolver como resultado observable
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      // Registrar el error en la consola
      console.error(`${operation} falló: ${error.message}`);

      // Transformar el error para una mejor UI
      console.log(`${operation} error details:`, error);

      // Devolver un resultado vacío para seguir ejecutando la aplicación
      return of(result as T);
    };
  }
}
