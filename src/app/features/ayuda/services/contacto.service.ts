import { Injectable, inject } from '@angular/core';
import { collection, Firestore, Timestamp, addDoc } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { MensajeContacto, EstadoMensaje, AgenteSoporte } from '../../../models/contacto.model';

@Injectable({
  providedIn: 'root'
})
export class ContactoService {
  private firestore = inject(Firestore);
  private reportesRef = collection(this.firestore, 'reportes');

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

  /**
   * Registra una incidencia a Firestore desde el formulario de contacto
   */
  async enviarMensaje(mensaje: MensajeContacto): Promise<void> {
    const incidencia = {
      ...mensaje,
      resuelto: false,
      tipo: 'contacto',
      fechaEnvio: Timestamp.now()
    };

    try {
      await addDoc(this.reportesRef, incidencia);
      console.log('Incidencia creada desde contacto:', incidencia);
    } catch (error) {
      console.error('Error al registrar incidencia:', error);
      throw error;
    }
  }

  getMensajesUsuario(): Observable<MensajeContacto[]> {
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
        respuesta: 'Gracias por contactarnos. Ya está resuelto.',
        fechaRespuesta: new Date('2025-04-21')
      }
    ];

    return of(mensajesEjemplo);
  }

  getAgentesDisponibles(): Observable<AgenteSoporte[]> {
    const agentesDisponibles = this.agentesEjemplo.filter(agente => agente.disponible);
    return of(agentesDisponibles);
  }
}
