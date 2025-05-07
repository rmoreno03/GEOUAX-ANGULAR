import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Tutorial } from '../../../models/tutorial.model';


@Injectable({
  providedIn: 'root'
})
export class TutorialesService {

  // Datos de ejemplo
  private tutorialesEjemplo: Tutorial[] = [
    {
      id: '1',
      titulo: 'Crear un punto en GeoUAX',
      descripcion: 'Aprende a crear un punto de localización en el mapa, subir fotos, y cómo la IA valida las imágenes antes de subirlas.',
      categoria: 'creacion',
      nivel: 'básico',
      duracion: '4 min',
      imagenUrl: 'portadaPuntosTutorial.png',
      fecha: new Date('2025-04-20'),
      visitas: 1264,
      pasos: [
        {
          titulo: 'Accede a la sección de puntos',
          descripcion: 'Desde el menú principal, dirígete a la sección "Puntos de localización" para comenzar.',
          imagen: 'tPuntos1.png'
        },
        {
          titulo: 'Haz clic en "Nuevo punto"',
          descripcion: 'Pulsa el botón "+" tanto arriba como encima de la tabla para abrir el formulario de creación.',
          imagen: 'tPuntos2.png'
        },
        {
          titulo: 'Selecciona la ubicación en el mapa',
          descripcion: 'Haz clic en el mapa o busca una ubicación concreta. Las coordenadas se rellenarán automáticamente con tan solo pinchar en el mapa.',
          imagen: 'tPuntos3.png'
        },
        {
          titulo: 'Añade alguna foto si quieres, un nombre y una descripción',
          descripcion: 'Sube una imagen del lugar. Nuestra IA validará que sea una fotografía real y relacionada con el entorno, además evitará que se suban imágenes ofensivas de cualquier tipo.',
          imagen: 'tPuntos4.png'
        },
        {
          titulo: 'Guarda el punto',
          descripcion: 'Verifica los datos y haz clic en "Guardar" para finalizar. El punto aparecerá en tu lista y en el mapa.',
          imagen: 'tPuntos5.png'
        }
      ],
      consejos: [
        'Usa imágenes claras y representativas del lugar',
        'Asegúrate de que la ubicación sea precisa',
        'Escribe una descripción detallada para ayudar a otros usuarios',
        'Puedes editar el punto más adelante si lo necesitas'
      ],
      videoUrl: 'https://youtu.be/ReKgKpwxWUA'
    },
    {
      id: '2',
      titulo: 'Cómo crear tu primera ruta',
      descripcion: 'Aprende a crear una ruta personalizada en GeoUAX paso a paso. Este tutorial cubre desde cómo acceder al mapa hasta cómo guardar y compartir tu ruta.',
      categoria: 'basicos',
      nivel: 'básico',
      duracion: '5 min',
      imagenUrl: 'portadaRutasTutorial.png',
      fecha: new Date('2025-04-10'),
      visitas: 1250,
      pasos: [
        {
          titulo: 'Accede a la sección de rutas',
          descripcion: 'Desde el menú principal, selecciona la opción "Rutas" para acceder al mapa interactivo.',
          imagen: 'tRutas1.png'
        },
        {
          titulo: 'Haz clic en "Crear ruta"',
          descripcion: 'En la parte superior derecha, encontrarás el botón "Crear ruta". Haz clic en él para comenzar.',
          imagen: 'tRutas2.png'
        },
        {
          titulo: 'Elige los puntos de tu ruta',
          descripcion: 'Haz clic en la seccion de puntos para elegir los puntos que tendrá tu ruta de tus puntos de interés previamente creados.',
          imagen: 'tRutas3.png'
        },
        {
          titulo: 'Configura las opciones',
          descripcion: 'Establece un nombre, tipo de ruta y privacidad para tu ruta.',
          imagen: 'tRutas4.png'
        },
        {
          titulo: 'Guarda tu ruta',
          descripcion: 'Haz clic en "Guardar" para finalizar. ¡Ya tienes tu primera ruta creada!',
          imagen: 'tRutas5.png'
        }
      ],
      consejos: [
        'Elige un nombre descriptivo para tu ruta',
        'Asegúrate de que los puntos estén en el orden correcto',
        'Recuerda que puedes editar la ruta más tarde si es necesario',
        'Puedes añadir fotos y descripciones a cada punto de interés',
        'Las rutas privadas solo son visibles para ti'
      ]
    },
    {
      id: '3',
      titulo: 'Configurar tu perfil de usuario',
      descripcion: 'Personaliza tu perfil en GeoUAX con tu información personal, preferencias y foto para que otros usuarios puedan conocerte mejor.',
      categoria: 'basicos',
      nivel: 'básico',
      duracion: '4 min',
      imagenUrl: 'portadaPerfilTutorial.png',
      fecha: new Date('2025-04-20'),
      visitas: 950,
      pasos: [
        {
          titulo: 'Accede a tu perfil',
          descripcion: 'En el menú principal, podrás ver el apartado de "Perfil". Haz clic en él para acceder a tu perfil personal.',
          imagen: 'tPerfil1.png'
        },
        {
          titulo: 'Edita tus datos personales',
          descripcion: 'Encontrarás este botón en la parte superior de tu perfil.',
          imagen: 'tPerfil2.png'
        },
        {
          titulo: 'Actualiza tu información',
          descripcion: 'Rellena los campos con tu información personal, intereses y experiencia en senderismo o ciclismo.',
          imagen: 'tPerfil3.png'
        },
        {
          titulo: 'Cambia tu foto de perfil',
          descripcion: 'Haz clic en el icono de la cámara sobre tu foto actual para subir una nueva imagen.',
          imagen: 'tPerfil4.png'
        },
        {
          titulo: 'Guarda los cambios',
          descripcion: 'No olvides hacer clic en "Guardar cambios" cuando hayas terminado de editar tu perfil.',
          imagen: 'tPerfil5.png'
        }
      ]
    }
    // Puedes añadir más tutoriales de ejemplo aquí
  ];

  constructor(private http: HttpClient) { }

  getTutoriales(): Observable<Tutorial[]> {
    return of(this.tutorialesEjemplo);
  }

  getTutorial(id: string): Observable<Tutorial | null> {
    const tutorial = this.tutorialesEjemplo.find(t => t.id === id) || null;
    return of(tutorial);
  }

  incrementarVisitas(id: string): Observable<{ success: boolean }> {
    const tutorial = this.tutorialesEjemplo.find(t => t.id === id);
    if (tutorial) {
      tutorial.visitas = (tutorial.visitas || 0) + 1;
    }
    return of({ success: true });
  }

  descargarPDF(id: string): Observable<Blob> {
    const pdfContent = new Blob(['Contenido del PDF', id], { type: 'application/pdf' });
    return of(pdfContent);
  }

  suscribirNewsletter(email: string): Observable<{ success: boolean }> {
    console.log(`Suscripción simulada para: ${email}`);
    return of({ success: true });
  }
}
