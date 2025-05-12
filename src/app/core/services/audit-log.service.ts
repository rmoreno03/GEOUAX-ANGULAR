import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  Timestamp,
  serverTimestamp
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

export interface LogEntry {
  id?: string;
  usuario: string;
  usuarioNombre?: string;
  accion: string;
  tipo: 'info' | 'warning' | 'error' | 'success';
  fecha: Timestamp;
  ip?: string;
  detalles?: any;
  entidadId?: string | null; // Cambiado a nullable
  entidadTipo?: 'usuario' | 'ruta' | 'punto' | 'sesion' | 'sistema' | 'impacto' ;
  browser?: string;
  plataforma?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  private logsRef;
  private userInfo: { ip?: string; browser?: string; plataforma?: string } | null = null;

  constructor(
    private firestore: Firestore,
    private auth: Auth
  ) {
    this.logsRef = collection(this.firestore, 'logs');
    this.initializeUserInfo();
  }

  private async initializeUserInfo() {
    try {
      // Intentar obtener información del navegador/plataforma
      if (typeof navigator !== 'undefined') {
        this.userInfo = {
          browser: navigator.userAgent,
          plataforma: navigator.platform
        };
      }

      // Intentar obtener IP (necesitarías un servicio externo)
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        if (this.userInfo) {
          this.userInfo.ip = data.ip;
        }
      } catch (ipError) {
        console.warn('No se pudo obtener la IP del usuario');
      }
    } catch (error) {
      console.error('Error al inicializar información del usuario:', error);
    }
  }

  private getUserEmail(): string {
    return this.auth.currentUser?.email || 'Usuario anónimo';
  }

  private getUserName(): string {
    return this.auth.currentUser?.displayName || 'Usuario sin nombre';
  }

  async log(
    accion: string,
    tipo: 'info' | 'warning' | 'error' | 'success',
    detalles?: any,
    entidadId?: string | null, // Cambiado a nullable
    entidadTipo?: 'usuario' | 'ruta' | 'punto' | 'sesion' | 'sistema'
  ): Promise<void> {
    try {
      // CORRECCIÓN: Si entidadId es undefined, asignarle null explícitamente
      if (entidadId === undefined) {
        entidadId = null;
      }

      const logEntry: Omit<LogEntry, 'id'> = {
        usuario: this.getUserEmail(),
        usuarioNombre: this.getUserName(),
        accion,
        tipo,
        fecha: serverTimestamp() as Timestamp,
        ip: this.userInfo?.ip,
        browser: this.userInfo?.browser,
        plataforma: this.userInfo?.plataforma,
        detalles,
        entidadId, // Ahora es null o un valor válido, nunca undefined
        entidadTipo
      };

      await addDoc(this.logsRef, logEntry);
      console.log('Log guardado:', accion);
    } catch (error) {
      console.error('Error al guardar log:', error);
    }
  }

  // Resto de métodos del servicio...
  // IMPORTANTE: Corregir todos los métodos que llaman a log para pasar null en vez de undefined

  // === SESIÓN ===
  async logInicioSesion() {
    await this.log(
      'Inicio de sesión',
      'success',
      { metodo: 'autenticación' },
      this.auth.currentUser?.uid || null, // null en vez de undefined
      'sesion'
    );
  }

  async logCierreSesion() {
    await this.log(
      'Cierre de sesión',
      'info',
      null,
      this.auth.currentUser?.uid || null, // null en vez de undefined
      'sesion'
    );
  }

  // === RUTAS ===
  async logRutaCreada(rutaId: string | null, nombreRuta: string) {
    await this.log(
      `Ruta creada: "${nombreRuta}"`,
      'success',
      { rutaId, nombreRuta },
      rutaId,
      'ruta'
    );
  }

  async logRutaEliminada(rutaId: string | null, nombreRuta: string) {
    await this.log(
      `Ruta eliminada: "${nombreRuta}"`,
      'warning',
      { rutaId, nombreRuta },
      rutaId,
      'ruta'
    );
  }

  async logRutaCompletada(rutaId: string | null, nombreRuta: string, tiempoTotal?: number) {
    await this.log(
      `Ruta completada: "${nombreRuta}"`,
      'success',
      { rutaId, nombreRuta, tiempoTotal },
      rutaId,
      'ruta'
    );
  }

  async logRutaVista(rutaId: string | null, nombreRuta: string) {
    await this.log(
      `Ruta vista: "${nombreRuta}"`,
      'info',
      { rutaId, nombreRuta },
      rutaId,
      'ruta'
    );
  }

  async logRutaValorada(rutaId: string | null, nombreRuta: string, valoracion: number) {
    await this.log(
      `Ruta valorada: "${nombreRuta}" - ${valoracion} estrellas`,
      'info',
      { rutaId, nombreRuta, valoracion },
      rutaId,
      'ruta'
    );
  }

  // === PUNTOS DE LOCALIZACIÓN ===
  async logPuntoCreado(puntoId: string | null, nombrePunto: string) {
    await this.log(
      `Punto de localización creado: "${nombrePunto}"`,
      'success',
      { puntoId, nombrePunto },
      puntoId,
      'punto'
    );
  }

  async logPuntoEliminado(puntoId: string | null, nombrePunto: string) {
    await this.log(
      `Punto de localización eliminado: "${nombrePunto}"`,
      'warning',
      { puntoId, nombrePunto },
      puntoId,
      'punto'
    );
  }

  async logPuntoCompletado(puntoId: string | null, nombrePunto: string, rutaId: string | null) {
    await this.log(
      `Punto completado: "${nombrePunto}"`,
      'success',
      { puntoId, nombrePunto, rutaId },
      puntoId,
      'punto'
    );
  }

  // === USUARIO ===
  async logPerfilActualizado(usuarioId: string | null, cambios: string[]) {
    await this.log(
      'Perfil actualizado',
      'info',
      { usuarioId, cambiosRealizados: cambios },
      usuarioId,
      'usuario'
    );
  }

  async logCambioPassword(usuarioId: string | null) {
    await this.log(
      'Contraseña cambiada',
      'warning',
      { usuarioId },
      usuarioId,
      'usuario'
    );
  }

  async logFotoPerfilSubida(usuarioId: string | null) {
    await this.log(
      'Foto de perfil actualizada',
      'info',
      { usuarioId },
      usuarioId,
      'usuario'
    );
  }

  // === ERRORES ===
  async logError(mensaje: string, error: any, contexto?: string) {
    await this.log(
      `Error: ${mensaje}`,
      'error',
      {
        error: error.toString(),
        stack: error.stack,
        contexto
      },
      null, // null en vez de undefined
      'sistema'
    );
  }

  // === SISTEMA ===
  async logActualizacionSistema(version: string) {
    await this.log(
      `Sistema actualizado a la versión ${version}`,
      'info',
      { version },
      null, // null en vez de undefined
      'sistema'
    );
  }

  async logMantenimiento(accion: string, detalles?: any) {
    await this.log(
      `Mantenimiento: ${accion}`,
      'warning',
      detalles,
      null, // null en vez de undefined
      'sistema'
    );
  }
}
