import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Notificacion {
  tipo: 'exito' | 'error' | 'info' | 'advertencia';
  mensaje: string;
  duracion?: number;
  id?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {
  // Observable que emite las notificaciones
  private notificacionSubject = new Subject<Notificacion>();
  notificacion$ = this.notificacionSubject.asObservable();

  // ID para las notificaciones
  private idContador = 0;

  constructor() { }

  /**
   * Muestra una notificación de éxito
   * @param mensaje Texto a mostrar
   * @param duracion Duración en ms (por defecto 3000ms)
   */
  mostrarExito(mensaje: string, duracion: number = 3000): void {
    this.mostrar({
      tipo: 'exito',
      mensaje,
      duracion
    });
  }

  /**
   * Muestra una notificación de error
   * @param mensaje Texto a mostrar
   * @param duracion Duración en ms (por defecto 5000ms)
   */
  mostrarError(mensaje: string, duracion: number = 5000): void {
    this.mostrar({
      tipo: 'error',
      mensaje,
      duracion
    });
  }

  /**
   * Muestra una notificación informativa
   * @param mensaje Texto a mostrar
   * @param duracion Duración en ms (por defecto 4000ms)
   */
  mostrarInfo(mensaje: string, duracion: number = 4000): void {
    this.mostrar({
      tipo: 'info',
      mensaje,
      duracion
    });
  }

  /**
   * Muestra una notificación de advertencia
   * @param mensaje Texto a mostrar
   * @param duracion Duración en ms (por defecto 4000ms)
   */
  mostrarAdvertencia(mensaje: string, duracion: number = 4000): void {
    this.mostrar({
      tipo: 'advertencia',
      mensaje,
      duracion
    });
  }

  /**
   * Método general para mostrar notificaciones
   * @param notificacion Objeto con los datos de la notificación
   */
  private mostrar(notificacion: Notificacion): void {
    // Asignar un ID único a la notificación
    const id = `notif-${this.idContador++}`;

    // Emitir la notificación con el ID
    this.notificacionSubject.next({
      ...notificacion,
      id
    });
  }
}
