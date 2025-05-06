import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { MensajeContacto, EstadoMensaje, AgenteSoporte } from '../../../models/contacto.model';


@Injectable({
  providedIn: 'root'
})
export class ContactoService {


  // Datos de agentes de ejemplo para desarrollo (se eliminará en producción)
  private agentesEjemplo: AgenteSoporte[] = [
    {
      id: '1',
      nombre: 'Sandra Martínez',
      avatar: 'assets/img/soporte/sandra.jpg',
      cargo: 'Especialista en Soporte Técnico',
      disponible: true
    },
    {
      id: '2',
      nombre: 'Carlos López',
      avatar: 'assets/img/soporte/carlos.jpg',
      cargo: 'Coordinador de Soporte',
      disponible: false
    },
    {
      id: '3',
      nombre: 'Laura González',
      avatar: 'assets/img/soporte/laura.jpg',
      cargo: 'Especialista en Experiencia de Usuario',
      disponible: true
    }
  ];

  constructor(private http: HttpClient) { }

  /**
   * Envía un mensaje de contacto
   * @param mensaje Mensaje a enviar
   */
  enviarMensaje(mensaje: MensajeContacto): Observable<any> {
    // En producción, utilizar esto:
    // return this.http.post<any>(`${this.apiUrl}/mensajes`, mensaje)
    //   .pipe(
    //     catchError(this.handleError<any>('enviarMensaje'))
    //   );

    // Para desarrollo, simular envío:
    console.log('Mensaje de contacto simulado:', mensaje);
    return of({ success: true, mensaje: 'Mensaje enviado correctamente' });
  }

  /**
   * Obtiene todos los mensajes de contacto enviados por el usuario actual
   */
  getMensajesUsuario(): Observable<MensajeContacto[]> {
    // En producción, utilizar esto:
    // return this.http.get<MensajeContacto[]>(`${this.apiUrl}/mensajes/usuario`)
    //   .pipe(
    //     catchError(this.handleError<MensajeContacto[]>('getMensajesUsuario', []))
    //   );

    // Para desarrollo, simular mensajes:
    const mensajesEjemplo: MensajeContacto[] = [
      {
        id: '1',
        nombre: 'Usuario Ejemplo',
        email: 'usuario@ejemplo.com',
        asunto: 'Problema con la creación de rutas',
        categoria: 'rutas',
        mensaje: 'No puedo crear una ruta nueva, me sale un error al intentar guardarla.',
        privacidad: true,
        newsletter: false,
        fechaEnvio: new Date('2025-04-20'),
        estado: EstadoMensaje.RESPONDIDO,
        respuesta: 'Gracias por contactarnos. Hemos solucionado el problema. Por favor, intenta crear la ruta nuevamente.',
        fechaRespuesta: new Date('2025-04-21')
      },
      {
        id: '2',
        nombre: 'Usuario Ejemplo',
        email: 'usuario@ejemplo.com',
        asunto: 'Solicitud de nueva funcionalidad',
        categoria: 'sugerencia',
        mensaje: 'Me gustaría sugerir una funcionalidad para exportar rutas en formato GPX.',
        privacidad: true,
        newsletter: true,
        fechaEnvio: new Date('2025-04-25'),
        estado: EstadoMensaje.PENDIENTE
      }
    ];

    return of(mensajesEjemplo);
  }

  /**
   * Obtiene los agentes de soporte disponibles para chat
   */
  getAgentesDisponibles(): Observable<AgenteSoporte[]> {
    // En producción, utilizar esto:
    // return this.http.get<AgenteSoporte[]>(`${this.apiUrl}/agentes/disponibles`)
    //   .pipe(
    //     catchError(this.handleError<AgenteSoporte[]>('getAgentesDisponibles', []))
    //   );

    // Para desarrollo, filtrar agentes disponibles:
    const agentesDisponibles = this.agentesEjemplo.filter(agente => agente.disponible);
    return of(agentesDisponibles);
  }

  /**
   * Inicia una sesión de chat con un agente de soporte
   * @param agenteId ID del agente (opcional, si no se proporciona se asigna uno disponible)
   */
  iniciarChat(agenteId?: string): Observable<any> {
    // En producción, utilizar esto:
    // return this.http.post<any>(`${this.apiUrl}/chat/iniciar`, { agenteId })
    //   .pipe(
    //     catchError(this.handleError<any>('iniciarChat'))
    //   );

    // Para desarrollo, simular inicio de chat:
    let agente;
    if (agenteId) {
      agente = this.agentesEjemplo.find(a => a.id === agenteId && a.disponible);
    } else {
      agente = this.agentesEjemplo.find(a => a.disponible);
    }

    if (!agente) {
      return of({ success: false, mensaje: 'No hay agentes disponibles en este momento' });
    }

    return of({
      success: true,
      chatId: 'chat-' + Date.now(),
      agente: agente
    });
  }

  /**
   * Envía un mensaje en la sesión de chat
   * @param chatId ID de la sesión de chat
   * @param mensaje Contenido del mensaje
   */
  enviarMensajeChat(chatId: string, mensaje: string): Observable<any> {
    // En producción, utilizar esto:
    // return this.http.post<any>(`${this.apiUrl}/chat/${chatId}/mensajes`, { mensaje })
    //   .pipe(
    //     catchError(this.handleError<any>('enviarMensajeChat'))
    //   );

    // Para desarrollo, simular envío de mensaje:
    console.log(`Mensaje enviado en chat ${chatId}: ${mensaje}`);
    return of({ success: true });
  }

  /**
   * Cierra una sesión de chat
   * @param chatId ID de la sesión de chat
   */
  cerrarChat(chatId: string): Observable<any> {
    // En producción, utilizar esto:
    // return this.http.post<any>(`${this.apiUrl}/chat/${chatId}/cerrar`, {})
    //   .pipe(
    //     catchError(this.handleError<any>('cerrarChat'))
    //   );

    // Para desarrollo, simular cierre de chat:
    console.log(`Chat ${chatId} cerrado`);
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
