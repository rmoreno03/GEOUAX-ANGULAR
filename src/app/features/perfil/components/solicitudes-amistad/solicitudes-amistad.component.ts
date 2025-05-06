import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { SolicitudAmistad } from '../../../../models/solicitud-amistad.model';
import { Usuario } from '../../../../models/usuario.model';
import { AmistadService } from '../../services/amistad.service';
import { PerfilService } from '../../services/perfil.service';
import { NotificacionesService } from '../../services/notificaciones.service';
import { Timestamp } from 'firebase/firestore';

@Component({
  standalone: false,
  selector: 'app-solicitudes-amistad',
  templateUrl: './solicitudes-amistad.component.html',
  styleUrls: ['./solicitudes-amistad.component.css']
})
export class SolicitudesAmistadComponent implements OnInit, OnDestroy {
  // Datos principales
  solicitudesRecibidas: SolicitudAmistad[] = [];
  solicitudesEnviadas: SolicitudAmistad[] = [];
  usuariosCache: Record<string, Usuario> = {};

  // Usuario actual
  uidActual: string | null = null;
  perfilActual: Usuario | null = null;

  // Estados de carga
  cargando = true;
  cargandoUsuarios = false;

  // Modal de búsqueda
  mostrarModalBusqueda = false;
  busquedaUsuarios = '';
  resultadosBusqueda: Usuario[] = [];

  // Tab actual
  tabActual: 'recibidas' | 'enviadas' = 'recibidas';

  // Subscripciones
  private subscripciones: Subscription[] = [];

  constructor(
    private amistadService: AmistadService,
    private perfilService: PerfilService,
    private notificacionesService: NotificacionesService,
    private router: Router
  ) {}

  async ngOnInit() {
    console.log('SolicitudesAmistadComponent iniciado');

    try {
      this.cargando = true;

      // Obtener el UID del usuario actual
      this.uidActual = this.perfilService.getUidActual();
      if (!this.uidActual) {
        // Usuario no autenticado, redirigir a login
        this.router.navigate(['/auth/login']);
        return;
      }

      // Cargar perfil actual para verificar amistades
      this.perfilActual = await this.perfilService.obtenerPerfil(this.uidActual);

      // Cargar solicitudes
      await this.cargarSolicitudes();
    } catch (err) {
      console.error('Error al inicializar la página de solicitudes:', err);
      this.notificacionesService.mostrarError('Error al cargar solicitudes');
    } finally {
      this.cargando = false;
    }
  }

  ngOnDestroy() {
    // Cancelar todas las subscripciones para evitar memory leaks
    this.subscripciones.forEach(sub => sub.unsubscribe());
  }

  cambiarTab(tab: 'recibidas' | 'enviadas') {
    this.tabActual = tab;
  }

  async cargarSolicitudes() {

    if (!this.uidActual) return;

    try {
      // Cargar solicitudes recibidas pendientes
      this.solicitudesRecibidas = await this.amistadService.obtenerSolicitudesPendientesRecibidas(this.uidActual);

      // Cargar solicitudes enviadas pendientes
      this.solicitudesEnviadas = await this.amistadService.obtenerSolicitudesPendientesEnviadas(this.uidActual);

      // Cargar datos de los usuarios
      const uidsUnicos = [...new Set([
        ...this.solicitudesRecibidas.map(s => s.uidSolicitante),
        ...this.solicitudesEnviadas.map(s => s.uidReceptor)
      ])];

      for (const uid of uidsUnicos) {
        if (!this.usuariosCache[uid]) {
          const datosUsuario = await this.perfilService.obtenerPerfil(uid);
          if (datosUsuario) {
            this.usuariosCache[uid] = datosUsuario;
          }
        }
      }

      // Marcar todas como notificadas
      for (const solicitud of this.solicitudesRecibidas) {
        if (!solicitud.notificado && solicitud.id) {
          await this.amistadService.marcarComoNotificada(solicitud.id);
        }
      }
    } catch (err) {
      console.error('Error al cargar solicitudes:', err);
      this.notificacionesService.mostrarError('No se pudieron cargar las solicitudes');
    }
  }

  async aceptarSolicitud(solicitud: SolicitudAmistad) {
    if (!solicitud.id) return;

    try {
      await this.amistadService.aceptarSolicitudAmistad(solicitud.id);

      // Actualizar lista de solicitudes
      this.solicitudesRecibidas = this.solicitudesRecibidas.filter(s => s.id !== solicitud.id);

      // Actualizar perfil actual
      await this.actualizarPerfilActual();

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
      this.solicitudesRecibidas = this.solicitudesRecibidas.filter(s => s.id !== solicitud.id);

      // Mostrar notificación
      this.notificacionesService.mostrarExito('Solicitud rechazada');
    } catch (err) {
      console.error('Error al rechazar solicitud:', err);
      this.notificacionesService.mostrarError('No se pudo rechazar la solicitud');
    }
  }

  async cancelarSolicitud(solicitud: SolicitudAmistad) {
    if (!solicitud.id) return;

    try {
      await this.amistadService.cancelarSolicitudAmistad(solicitud.id);

      // Actualizar lista de solicitudes
      this.solicitudesEnviadas = this.solicitudesEnviadas.filter(s => s.id !== solicitud.id);

      // Mostrar notificación
      this.notificacionesService.mostrarExito('Solicitud cancelada');
    } catch (err) {
      console.error('Error al cancelar solicitud:', err);
      this.notificacionesService.mostrarError('No se pudo cancelar la solicitud');
    }
  }

  async enviarSolicitudAmistad(usuario: Usuario) {
    if (!this.uidActual) return;

    try {
      const idSolicitud = await this.amistadService.enviarSolicitudAmistad(this.uidActual, usuario.uid);

      // Añadir a la lista de solicitudes enviadas
      const nuevaSolicitud: SolicitudAmistad = {
        id: idSolicitud,
        uidSolicitante: this.uidActual,
        uidReceptor: usuario.uid,
        estado: 'pendiente',
        fechaSolicitud: new Date(),
        notificado: false
      };

      this.solicitudesEnviadas.push(nuevaSolicitud);

      // Mostrar notificación
      this.notificacionesService.mostrarExito(`Solicitud enviada a ${usuario.nombre}`);

      // Cerrar modal de búsqueda
      this.cerrarModalBusqueda();
    } catch (err) {
      console.error('Error al enviar solicitud:', err);
      this.notificacionesService.mostrarError('No se pudo enviar la solicitud');
    }
  }

  // Funciones para el modal de búsqueda
  abrirBuscadorUsuarios() {
    this.mostrarModalBusqueda = true;
    this.busquedaUsuarios = '';
    this.resultadosBusqueda = [];
  }

  cerrarModalBusqueda() {
    this.mostrarModalBusqueda = false;
    this.busquedaUsuarios = '';
    this.resultadosBusqueda = [];
  }

  async buscarUsuarios() {
    if (!this.busquedaUsuarios || this.busquedaUsuarios.length < 3) {
      this.resultadosBusqueda = [];
      return;
    }

    try {
      this.cargandoUsuarios = true;

      // Implementar búsqueda según tu lógica de Firebase
      this.resultadosBusqueda = await this.perfilService.buscarUsuarios(this.busquedaUsuarios);

      // Filtrar al propio usuario
      this.resultadosBusqueda = this.resultadosBusqueda.filter(u => u.uid !== this.uidActual);

      // Actualizar caché de usuarios
      for (const usuario of this.resultadosBusqueda) {
        this.usuariosCache[usuario.uid] = usuario;
      }
    } catch (err) {
      console.error('Error al buscar usuarios:', err);
      this.notificacionesService.mostrarError('Error al buscar usuarios');
    } finally {
      this.cargandoUsuarios = false;
    }
  }

  // Funciones auxiliares
  esAmigo(uid: string): boolean {
    return !!this.perfilActual?.amigos && this.perfilActual.amigos.includes(uid);
  }

  tieneSolicitudPendiente(uid: string): boolean {
    // Verificar si hay solicitud enviada pendiente
    return this.solicitudesEnviadas.some(s => s.uidReceptor === uid && s.estado === 'pendiente') ||
           this.solicitudesRecibidas.some(s => s.uidSolicitante === uid && s.estado === 'pendiente');
  }

  getNombreUsuario(uid: string): string {
    return this.usuariosCache[uid]?.nombre || 'Usuario desconocido';
  }

  getBioUsuario(uid: string): string {
    const bio = this.usuariosCache[uid]?.biografia;
    if (!bio) return 'Sin biografía';
    return bio.length > 100 ? bio.substring(0, 100) + '...' : bio;
  }

  getAvatarUrl(uid: string): string {
    return this.usuariosCache[uid]?.fotoUrl || 'perfilDefault.png';
  }

  async actualizarPerfilActual() {
    if (!this.uidActual) return;
    this.perfilActual = await this.perfilService.obtenerPerfil(this.uidActual);
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
      return `hoy a las ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    }

    // Si es ayer, mostrar "Ayer"
    const ayer = new Date(ahora);
    ayer.setDate(ayer.getDate() - 1);
    if (date.toDateString() === ayer.toDateString()) {
      return `ayer a las ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    }

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
