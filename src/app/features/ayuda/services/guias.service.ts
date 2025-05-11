import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Guia, SolicitudGuia, EstadoSolicitud } from '../../../models/guia.model';

@Injectable({
  providedIn: 'root'
})
export class GuiasService {

  // Datos de ejemplo para desarrollo (se eliminará en producción)
  private guiasEjemplo: Guia[] = [
    {
      id: '1',
      titulo: 'Manual completo de GeoUAX',
      descripcion: 'Guía detallada con todas las funcionalidades de la aplicación GeoUAX. Incluye capturas de pantalla y explicaciones paso a paso.',
      categoria: 'manuales',
      fecha: new Date('2025-04-10'),
      paginas: 45,
      tamanoMB: 3.2,
      descargas: 1250,
      colorFondo: '#4285f4',
      paginasPreview: [
        'assets/img/guias/manual-preview-1.jpg',
        'assets/img/guias/manual-preview-2.jpg',
        'assets/img/guias/manual-preview-3.jpg'
      ],
      etiquetas: ['manual', 'guía', 'completo', 'funcionalidades'],
      autor: 'Equipo GeoUAX',
      version: '1.2'
    },
    {
      id: '2',
      titulo: 'Guía rápida para principiantes',
      descripcion: 'Introducción básica a GeoUAX para nuevos usuarios. Aprende a configurar tu cuenta y usar las funciones principales en minutos.',
      categoria: 'basicas',
      fecha: new Date('2025-04-12'),
      paginas: 12,
      tamanoMB: 1.5,
      descargas: 2300,
      colorFondo: '#34a853',
      paginasPreview: [
        'assets/img/guias/principiantes-preview-1.jpg',
        'assets/img/guias/principiantes-preview-2.jpg'
      ],
      etiquetas: ['principiantes', 'introducción', 'básico'],
      autor: 'Equipo GeoUAX',
      version: '1.0'
    },
    {
      id: '3',
      titulo: 'Creación avanzada de rutas',
      descripcion: 'Aprende técnicas avanzadas para crear rutas personalizadas, incluyendo waypoints, puntos de interés, estimación de tiempos y más.',
      categoria: 'avanzadas',
      fecha: new Date('2025-04-15'),
      paginas: 28,
      tamanoMB: 2.8,
      descargas: 980,
      colorFondo: '#ea4335',
      paginasPreview: [
        'assets/img/guias/rutas-preview-1.jpg',
        'assets/img/guias/rutas-preview-2.jpg',
        'assets/img/guias/rutas-preview-3.jpg',
        'assets/img/guias/rutas-preview-4.jpg'
      ],
      etiquetas: ['rutas', 'avanzado', 'waypoints', 'personalización'],
      autor: 'Carlos Ruiz',
      version: '2.1'
    },
    {
      id: '4',
      titulo: 'Guía de funciones sociales',
      descripcion: 'Todo sobre las características sociales de GeoUAX: cómo conectar con amigos, compartir rutas, participar en desafíos y organizar eventos.',
      categoria: 'manuales',
      fecha: new Date('2025-04-18'),
      paginas: 20,
      tamanoMB: 2.1,
      descargas: 750,
      colorFondo: '#fbbc05',
      paginasPreview: [
        'assets/img/guias/social-preview-1.jpg',
        'assets/img/guias/social-preview-2.jpg'
      ],
      etiquetas: ['social', 'amigos', 'compartir', 'eventos'],
      autor: 'Laura González',
      version: '1.5'
    },
    {
      id: '5',
      titulo: 'Manual de importación y exportación de datos',
      descripcion: 'Aprende a importar y exportar tus rutas en diferentes formatos (GPX, KML, TCX) y cómo sincronizar con otras aplicaciones y dispositivos.',
      categoria: 'avanzadas',
      fecha: new Date('2025-04-20'),
      paginas: 18,
      tamanoMB: 1.9,
      descargas: 650,
      colorFondo: '#673ab7',
      paginasPreview: [
        'assets/img/guias/import-export-preview-1.jpg',
        'assets/img/guias/import-export-preview-2.jpg'
      ],
      etiquetas: ['importar', 'exportar', 'GPX', 'KML', 'formatos'],
      autor: 'Miguel Sánchez',
      version: '1.3'
    }
    // Puedes añadir más guías de ejemplo aquí
  ];

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todas las guías disponibles
   */
  getGuias(): Observable<Guia[]> {
    // En producción, utilizar esto:
    // return this.http.get<Guia[]>(this.apiUrl)
    //   .pipe(
    //     catchError(this.handleError<Guia[]>('getGuias', []))
    //   );

    // Para desarrollo, usar datos de ejemplo:
    return of(this.guiasEjemplo);
  }

  /**
   * Obtiene una guía específica por su ID
   * @param id ID de la guía
   */
  getGuia(id: string): Observable<Guia> {
    // En producción, utilizar esto:
    // const url = `${this.apiUrl}/${id}`;
    // return this.http.get<Guia>(url)
    //   .pipe(
    //     catchError(this.handleError<Guia>(`getGuia id=${id}`))
    //   );

    // Para desarrollo, usar datos de ejemplo:
    const guia = this.guiasEjemplo.find(guia => guia.id === id);
    if (!guia) {
      throw new Error(`Guía con ID ${id} no encontrada`);
    }
    return of(guia);
  }

  /**
   * Descarga una guía PDF
   * @param id ID de la guía
   */
  descargarGuia(): Observable<Blob> {
    // En producción, utilizar esto:
    // const url = `${this.apiUrl}/${id}/descargar`;
    // return this.http.get(url, { responseType: 'blob' })
    //   .pipe(
    //     catchError(this.handleError<Blob>('descargarGuia'))
    //   );

    // Para desarrollo, simular descarga:
    // Creamos un PDF vacío para el ejemplo
    const pdfContent = new Blob(['Contenido del PDF'], { type: 'application/pdf' });
    return of(pdfContent);
  }

  /**
   * Incrementa el contador de descargas de una guía
   * @param id ID de la guía
   */
  incrementarDescargas(id: string): Observable<any> {
    // En producción, utilizar esto:
    // const url = `${this.apiUrl}/${id}/incrementar-descargas`;
    // return this.http.post<any>(url, {})
    //   .pipe(
    //     catchError(this.handleError<any>('incrementarDescargas'))
    //   );

    // Para desarrollo, simular incremento:
    const guia = this.guiasEjemplo.find(g => g.id === id);
    if (guia && guia.descargas !== undefined) {
      guia.descargas += 1;
    }
    return of({ success: true });
  }

  /**
   * Solicita la creación de una nueva guía
   * @param tema Tema de la guía solicitada
   */
  solicitarGuia(tema: string): Observable<any> {
    // En producción, utilizar esto:
    // return this.http.post<any>(`${this.apiUrl}/solicitudes`, { tema })
    //   .pipe(
    //     catchError(this.handleError<any>('solicitarGuia'))
    //   );

    // Para desarrollo, simular la solicitud:
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

  /**
   * Obtiene las solicitudes de guías realizadas por el usuario actual
   */
  getSolicitudesUsuario(): Observable<SolicitudGuia[]> {
    // En producción, utilizar esto:
    // return this.http.get<SolicitudGuia[]>(`${this.apiUrl}/solicitudes/usuario`)
    //   .pipe(
    //     catchError(this.handleError<SolicitudGuia[]>('getSolicitudesUsuario', []))
    //   );

    // Para desarrollo, simular solicitudes:
    const solicitudesEjemplo: SolicitudGuia[] = [
      {
        id: '1',
        tema: 'Guía para utilizar la aplicación en montaña',
        fechaSolicitud: new Date('2025-04-15'),
        estado: EstadoSolicitud.COMPLETADA,
        respuesta: 'Hemos creado la guía solicitada. Ya puedes descargarla.',
        fechaRespuesta: new Date('2025-04-25'),
        guiaCreada: '6' // ID de la guía creada
      },
      {
        id: '2',
        tema: 'Manual para sincronización con relojes inteligentes',
        fechaSolicitud: new Date('2025-04-20'),
        estado: EstadoSolicitud.EN_PROCESO
      }
    ];

    return of(solicitudesEjemplo);
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
