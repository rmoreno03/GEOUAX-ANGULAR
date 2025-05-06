import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription, from, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { SolicitudAmistad } from '../../../../models/solicitud-amistad.model';
import { Usuario } from '../../../../models/usuario.model';
import { AmistadService } from '../../services/amistad.service';
import { PerfilService } from '../../services/perfil.service';
import { NotificacionesService } from '../../services/notificaciones.service';
import { Timestamp } from 'firebase/firestore';

@Component({
  standalone: false,
  selector: 'app-notificaciones-solicitudes',
  templateUrl: './notificaciones-solicitudes.component.html',
  styleUrls: ['./notificaciones-solicitudes.component.css']
})
export class NotificacionesSolicitudesComponent implements OnInit, OnDestroy {
  solicitudesPendientes: SolicitudAmistad[] = [];
  totalSolicitudes = 0;

  // Cache de datos de usuario para evitar peticiones repetidas
  usuariosCache: Record<string, Usuario> = {};

  // Para comprobar periódicamente nuevas solicitudes
  private checkInterval: Subscription | null = null;

  constructor(
    private amistadService: AmistadService,
    private perfilService: PerfilService,
    private notificacionesService: NotificacionesService
  ) {}

  async ngOnInit() {
    // Cargar solicitudes pendientes
    await this.cargarSolicitudesPendientes();

    // Comprobar nuevas solicitudes cada 60 segundos
    this.checkInterval = interval(60000).pipe(
      switchMap(() => {
        return from(this.cargarSolicitudesPendientes());
      })
    ).subscribe();
  }

  ngOnDestroy() {
    // Limpiar la suscripción al intervalo
    if (this.checkInterval) {
      this.checkInterval.unsubscribe();
    }
  }

  async cargarSolicitudesPendientes() {
    const uidActual = this.perfilService.getUidActual();
    if (!uidActual) return;

    try {
      // Obtener solicitudes pendientes
      this.solicitudesPendientes = await this.amistadService.obtenerSolicitudesPendientesRecibidas(uidActual);
      this.totalSolicitudes = this.solicitudesPendientes.length;

      // Cargar datos de los usuarios solicitantes
      for (const solicitud of this.solicitudesPendientes) {
        if (!this.usuariosCache[solicitud.uidSolicitante]) {
          const datosUsuario = await this.perfilService.obtenerPerfil(solicitud.uidSolicitante);
          if (datosUsuario) {
            this.usuariosCache[solicitud.uidSolicitante] = datosUsuario;
          }
        }

        // Marcar como notificada si no lo está
        if (!solicitud.notificado && solicitud.id) {
          await this.amistadService.marcarComoNotificada(solicitud.id);
        }
      }
    } catch (err) {
      console.error('Error al cargar solicitudes pendientes:', err);
    }
  }

  async aceptarSolicitud(solicitud: SolicitudAmistad) {
    if (!solicitud.id) return;

    try {
      await this.amistadService.aceptarSolicitudAmistad(solicitud.id);

      // Actualizar lista de solicitudes
      this.solicitudesPendientes = this.solicitudesPendientes.filter(s => s.id !== solicitud.id);
      this.totalSolicitudes = this.solicitudesPendientes.length;

      // Mostrar notificación
      const nombreSolicitante = this.getNombreUsuario(solicitud.uidSolicitante);
      this.notificacionesService.mostrarExito(`Has aceptado la solicitud de ${nombreSolicitante}`);
    } catch (err) {
      console.error('Error al aceptar solicitud:', err);
      this.notificacionesService.mostrarError('No se pudo aceptar la solicitud');
    }
  }

  async rechazarSolicitud(solicitud: SolicitudAmistad) {
    if (!solicitud.id) return;

    try {
      await this.amistadService.rechazarSolicitudAmistad(solicitud.id);

      // Actualizar lista de solicitudes
      this.solicitudesPendientes = this.solicitudesPendientes.filter(s => s.id !== solicitud.id);
      this.totalSolicitudes = this.solicitudesPendientes.length;

      // Mostrar notificación
      this.notificacionesService.mostrarExito('Solicitud rechazada');
    } catch (err) {
      console.error('Error al rechazar solicitud:', err);
      this.notificacionesService.mostrarError('No se pudo rechazar la solicitud');
    }
  }

  cerrarTodas() {
    // Ocultar componente
    this.solicitudesPendientes = [];
  }

  // Obtener nombre del usuario solicitante
  getNombreUsuario(uid: string): string {
    return this.usuariosCache[uid]?.nombre || 'Usuario desconocido';
  }

  // Obtener URL de avatar
  getAvatarUrl(uid: string): string {
    return this.usuariosCache[uid]?.fotoUrl || 'perfilDefault.png';
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

    // Si es hoy, mostrar la hora
    const ahora = new Date();
    if (date.toDateString() === ahora.toDateString()) {
      return `Hoy a las ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    }

    // Si es ayer, mostrar "Ayer"
    const ayer = new Date(ahora);
    ayer.setDate(ayer.getDate() - 1);
    if (date.toDateString() === ayer.toDateString()) {
      return `Ayer a las ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    }

    // En otro caso, mostrar fecha completa
    return date.toLocaleString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(',', '');
  }
}
