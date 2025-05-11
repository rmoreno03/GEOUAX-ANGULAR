import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { PreguntaFrecuente } from '../../../models/pregunta-frecuente.model';
import { RespuestaOperacionSimple, RespuestaSolicitudGuia } from '../../../models/RespuestaSolicitada.model';
import { EstadoSolicitud } from '../../../models/guia.model';

@Injectable({
  providedIn: 'root'
})
export class PreguntasFrecuentesService {

  // Datos de ejemplo para desarrollo (se eliminará en producción)
  private preguntasEjemplo: PreguntaFrecuente[] = [
    {
      id: '1',
      pregunta: '¿Cómo puedo crear una cuenta en GeoUAX?',
      respuesta: 'Para crear una cuenta en GeoUAX, haz clic en el botón "Registrarse" en la página principal. Deberás proporcionar tu nombre, correo electrónico y establecer una contraseña. También puedes registrarte utilizando tu cuenta de Google o Facebook para simplificar el proceso.',
      categoria: 'cuenta',
      fechaCreacion: new Date('2025-03-10'),
      fechaActualizacion: new Date('2025-04-05'),
      visitas: 1250,
      valoraciones: {
        utiles: 120,
        noUtiles: 5
      },
      etiquetas: ['registro', 'cuenta', 'iniciar sesión'],
      links: [
        {
          texto: 'Ir a página de registro',
          url: '/auth/registro',
          interno: true
        },
        {
          texto: 'Ver tutorial de registro',
          url: '/ayuda/tutoriales/registro',
          interno: true
        }
      ]
    },
    {
      id: '2',
      pregunta: '¿Cómo puedo recuperar mi contraseña si la he olvidado?',
      respuesta: 'Si has olvidado tu contraseña, puedes restablecerla fácilmente siguiendo estos pasos:<br><br>1. Haz clic en "Iniciar sesión" en la página principal.<br>2. Selecciona la opción "¿Olvidaste tu contraseña?"<br>3. Introduce tu correo electrónico registrado.<br>4. Recibirás un enlace para restablecer tu contraseña en tu correo.<br>5. Sigue las instrucciones del correo para crear una nueva contraseña.<br><br>El enlace de restablecimiento expira después de 24 horas por motivos de seguridad.',
      categoria: 'cuenta',
      fechaCreacion: new Date('2025-03-15'),
      visitas: 980,
      valoraciones: {
        utiles: 95,
        noUtiles: 3
      },
      etiquetas: ['contraseña', 'recuperación', 'cuenta'],
      links: [
        {
          texto: 'Ir a recuperación de contraseña',
          url: '/auth/recuperar',
          interno: true
        }
      ]
    },
    {
      id: '3',
      pregunta: '¿Cómo puedo eliminar una ruta que he creado?',
      respuesta: 'Para eliminar una ruta que has creado, sigue estos pasos:<br><br>1. Accede a tu perfil de usuario.<br>2. Selecciona la pestaña "Mis Rutas".<br>3. Busca la ruta que deseas eliminar.<br>4. Haz clic en los tres puntos (⋮) que aparecen en la esquina de la tarjeta de la ruta.<br>5. Selecciona "Eliminar".<br>6. Confirma la eliminación.<br><br>Ten en cuenta que esta acción es irreversible y no podrás recuperar la ruta una vez eliminada. Si prefieres mantenerla pero no mostrarla públicamente, puedes cambiar su configuración a "Privada" en lugar de eliminarla.',
      categoria: 'rutas',
      fechaCreacion: new Date('2025-03-20'),
      fechaActualizacion: new Date('2025-04-10'),
      visitas: 750,
      valoraciones: {
        utiles: 85,
        noUtiles: 2
      },
      etiquetas: ['rutas', 'eliminar', 'perfil'],
      links: [
        {
          texto: 'Ver tutorial sobre gestión de rutas',
          url: '/ayuda/tutoriales/gestion-rutas',
          interno: true
        }
      ]
    },
    {
      id: '4',
      pregunta: '¿Puedo usar GeoUAX sin conexión a internet?',
      respuesta: 'GeoUAX ofrece funcionalidad limitada sin conexión a internet. Aquí está lo que puedes y no puedes hacer:<br><br><strong>Puedes hacer sin conexión:</strong><br>- Ver rutas que hayas descargado previamente.<br>- Utilizar mapas previamente almacenados en caché.<br>- Seguir rutas utilizando GPS (que funciona sin internet).<br>- Ver tus estadísticas personales guardadas.<br><br><strong>No puedes hacer sin conexión:</strong><br>- Crear nuevas rutas.<br>- Buscar o explorar rutas de otros usuarios.<br>- Actualizar tu perfil.<br>- Interactuar con otros usuarios.<br><br>Para utilizar GeoUAX sin conexión, asegúrate de descargar las rutas que necesites mientras estés conectado a internet. Ve a la ruta deseada y utiliza la opción "Descargar para uso sin conexión".',
      categoria: 'aplicacion',
      fechaCreacion: new Date('2025-03-25'),
      visitas: 1100,
      valoraciones: {
        utiles: 130,
        noUtiles: 10
      },
      etiquetas: ['sin conexión', 'offline', 'mapas', 'descargar']
    },
    {
      id: '5',
      pregunta: '¿Cómo puedo compartir una ruta con mis amigos?',
      respuesta: 'Existen varias formas de compartir una ruta con tus amigos en GeoUAX:<br><br>1. <strong>Compartir directamente en la app</strong>: Desde la vista de detalles de una ruta, pulsa el botón "Compartir" y selecciona los amigos con los que quieres compartirla.<br><br>2. <strong>Compartir en redes sociales</strong>: Pulsa el botón "Compartir" y selecciona la red social donde quieres publicarla (Facebook, Twitter, Instagram, etc.).<br><br>3. <strong>Compartir mediante enlace</strong>: Pulsa "Obtener enlace" y podrás copiar un enlace directo a la ruta para enviarlo por WhatsApp, email o cualquier otra plataforma.<br><br>4. <strong>Código QR</strong>: Genera un código QR que tus amigos pueden escanear para acceder directamente a la ruta.<br><br>Recuerda que solo se pueden compartir rutas públicas. Si tu ruta es privada, deberás cambiar su configuración a pública antes de poder compartirla.',
      categoria: 'social',
      fechaCreacion: new Date('2025-04-01'),
      visitas: 820,
      valoraciones: {
        utiles: 90,
        noUtiles: 3
      },
      etiquetas: ['compartir', 'rutas', 'social', 'amigos'],
      links: [
        {
          texto: 'Ver tutorial sobre compartir rutas',
          url: '/ayuda/tutoriales/compartir-rutas',
          interno: true
        }
      ]
    }
    // Puedes añadir más preguntas de ejemplo aquí
  ];

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todas las preguntas frecuentes
   */
  getPreguntas(): Observable<PreguntaFrecuente[]> {
    // En producción, utilizar esto:
    // return this.http.get<PreguntaFrecuente[]>(this.apiUrl)
    //   .pipe(
    //     catchError(this.handleError<PreguntaFrecuente[]>('getPreguntas', []))
    //   );

    // Para desarrollo, usar datos de ejemplo:
    return of(this.preguntasEjemplo);
  }

  /**
   * Obtiene una pregunta frecuente por su ID
   * @param id ID de la pregunta
   */
  getPregunta(id: string): Observable<PreguntaFrecuente> {
    // En producción, utilizar esto:
    // const url = `${this.apiUrl}/${id}`;
    // return this.http.get<PreguntaFrecuente>(url)
    //   .pipe(
    //     catchError(this.handleError<PreguntaFrecuente>(`getPregunta id=${id}`))
    //   );

    // Para desarrollo, usar datos de ejemplo:
    const pregunta = this.preguntasEjemplo.find(pregunta => pregunta.id === id);
    if (!pregunta) {
      throw new Error(`PreguntaFrecuente with id ${id} not found`);
    }
    return of(pregunta);
  }



  /**
   * Marca una pregunta como útil o no útil
   * @param id ID de la pregunta
   * @param util true = útil, false = no útil, null = eliminar valoración
   */
  marcarUtilidad(id: string, util: boolean | null): Observable<any> {
    // En producción, utilizar esto:
    // const url = `${this.apiUrl}/${id}/valorar`;
    // return this.http.post<any>(url, { util })
    //   .pipe(
    //     catchError(this.handleError<any>('marcarUtilidad'))
    //   );

    // Para desarrollo, simular valoración:
    const pregunta = this.preguntasEjemplo.find(p => p.id === id);
    if (pregunta && pregunta.valoraciones) {
      if (util === true) {
        pregunta.valoraciones.utiles += 1;
      } else if (util === false) {
        pregunta.valoraciones.noUtiles += 1;
      }
      // Si es null, simularíamos la eliminación de una valoración previa
    }
    return of({ success: true });
  }

  solicitarGuia(tema: string): Observable<RespuestaSolicitudGuia> {
    console.log(`Solicitud de guía recibida para tema: ${tema}`);
    return of({
      success: true,
      mensaje: 'Solicitud recibida correctamente',
      solicitud: {
        id: 'solicitud-' + Date.now(),
        tema: tema,
        fechaSolicitud: new Date(),
        estado: EstadoSolicitud.PENDIENTE
      }
    });
  }

  incrementarVisitas(id: string): Observable<RespuestaOperacionSimple> {
    const pregunta = this.preguntasEjemplo.find(p => p.id === id);
    if (pregunta && pregunta.visitas !== undefined) {
      pregunta.visitas += 1;
    }
    return of({ success: true });
  }


  /**
   * Busca preguntas frecuentes por término de búsqueda
   * @param termino Término de búsqueda
   */
  buscarPreguntas(termino: string): Observable<PreguntaFrecuente[]> {
    // En producción, utilizar esto:
    // const url = `${this.apiUrl}/buscar?q=${encodeURIComponent(termino)}`;
    // return this.http.get<PreguntaFrecuente[]>(url)
    //   .pipe(
    //     catchError(this.handleError<PreguntaFrecuente[]>('buscarPreguntas', []))
    //   );

    // Para desarrollo, simular búsqueda:
    if (!termino.trim()) {
      return of([]);
    }
    const terminoLower = termino.toLowerCase();
    return of(this.preguntasEjemplo.filter(pregunta =>
      pregunta.pregunta.toLowerCase().includes(terminoLower) ||
      pregunta.respuesta.toLowerCase().includes(terminoLower) ||
      pregunta.etiquetas?.some((etiqueta: string) => etiqueta.toLowerCase().includes(terminoLower))
    ));
  }

  /**
   * Maneja los errores HTTP
   * @param operation Nombre de la operación que falló
   * @param result Valor opcional para devolver como resultado observable
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: unknown): Observable<T> => {
      if (error instanceof Error) {
        console.error(`${operation} falló: ${error.message}`);
      } else {
        console.error(`${operation} falló: error desconocido`, error);
      }

      console.log(`${operation} error details:`, error);

      return of(result as T);
    };
  }
}
