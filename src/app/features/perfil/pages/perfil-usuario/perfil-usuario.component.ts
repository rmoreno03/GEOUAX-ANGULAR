import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { Usuario } from '../../../../models/usuario.model';
import { Ruta } from '../../../../models/ruta.model';
import { PerfilService } from '../../services/perfil.service';
import { RutasService } from '../../../rutas/services/rutas.service';
import { AmistadService } from '../../services/amistad.service';
import { Timestamp } from 'firebase/firestore';

@Component({
  standalone: false,
  selector: 'app-perfil-usuario',
  templateUrl: './perfil-usuario.component.html',
  styleUrls: ['./perfil-usuario.component.css']
})
export class PerfilUsuarioComponent implements OnInit, OnDestroy {
  usuario: Usuario | null = null;
  uidActual: string | null = null;
  perfilActual: Usuario | null = null;

  esAmigo = false;
  solicitudEnviada = false;
  solicitudRecibida = false;
  idSolicitud: string | null = null;

  rutasPublicas: Ruta[] = [];
  amigosData: Usuario[] = [];

  cargando = true;
  cargandoRutas = false;
  cargandoAmigos = false;
  error = false;
  mensajeError = '';

  tabActual: 'info' | 'rutas' | 'amigos' = 'info';

  private subscripciones: Subscription[] = [];

  // Popups
  mostrarPopup = false;
  mensajePopup = '';
  tipoPopup: 'exito' | 'eliminado' | 'warning' = 'exito';

  // Confirmación
  mostrarConfirmacion = false;
  mensajeConfirmacion = '';
  accionConfirmada: (() => void) | null = null;


  constructor(
    private perfilService: PerfilService,
    private rutasService: RutasService,
    private amistadService: AmistadService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.uidActual = this.perfilService.getUidActual();
    if (!this.uidActual) {
      this.router.navigate(['/auth/login']);
      return;
    }

    const sub = this.route.paramMap.subscribe(async (params) => {
      const uidPerfil = params.get('uid');
      if (!uidPerfil) {
        this.error = true;
        this.mensajeError = 'No se especificó un usuario para mostrar';
        return;
      }
      await this.cargarPerfil(uidPerfil);
    });
    this.subscripciones.push(sub);
  }

  ngOnDestroy() {
    this.subscripciones.forEach(sub => sub.unsubscribe());
  }

  async cargarPerfil(uidPerfil: string) {
    this.cargando = true;
    this.error = false;
    this.mensajeError = '';
    this.usuario = null;
    this.rutasPublicas = [];
    this.amigosData = [];
    this.tabActual = 'info';

    try {
      if (uidPerfil === this.uidActual) {
        this.router.navigate(['/perfil/mi-perfil']);
        return;
      }

      this.usuario = await this.perfilService.obtenerPerfil(uidPerfil);
      if (!this.usuario) {
        this.error = true;
        this.mensajeError = 'El perfil que intentas ver no existe';
        return;
      }

      if (this.uidActual) {
        this.perfilActual = await this.perfilService.obtenerPerfil(this.uidActual);
      }
      this.esAmigo = this.perfilActual?.amigos?.includes(this.usuario.uid) || false;

      await this.verificarSolicitudAmistad();
      await this.cargarRutas(this.usuario.uid);
      if (this.usuario.amigos?.length) {
        await this.cargarDatosAmigos();
      }
    } catch (err) {
      console.error('Error al cargar perfil:', err);
      this.error = true;
      this.mensajeError = 'No se pudo cargar el perfil. Por favor, intenta de nuevo.';
    } finally {
      this.cargando = false;
    }
  }

  cambiarTab(tab: 'info' | 'rutas' | 'amigos') {
    this.tabActual = tab;
    if (tab === 'rutas' && this.rutasPublicas.length === 0 && this.usuario) {
      this.cargarRutas(this.usuario.uid);
    } else if (tab === 'amigos' && this.amigosData.length === 0 && this.usuario?.amigos?.length) {
      this.cargarDatosAmigos();
    }
  }

  volver() {
    this.router.navigate(['/perfil/mi-perfil']);
  }

  async cargarRutas(uid: string) {
    try {
      this.cargandoRutas = true;
      this.rutasPublicas = await this.rutasService.cargarRutasPublicasPorUsuario(uid);
    } catch (err) {
      console.error('Error al cargar rutas:', err);
      this.mostrarExito('No se pudieron cargar las rutas', 'warning');
    } finally {
      this.cargandoRutas = false;
    }
  }

  async cargarDatosAmigos() {
    try {
      this.cargandoAmigos = true;
      this.amigosData = [];

      if (!this.usuario?.amigos || !Array.isArray(this.usuario.amigos)) {
        return;
      }

      for (const amigoUid of this.usuario.amigos) {
        // Verificar que el ID del amigo sea válido
        if (!amigoUid || typeof amigoUid !== 'string' || amigoUid === 'usuarios') {
          console.warn('ID de amigo no válido encontrado:', amigoUid);
          continue; // Saltar este ID y continuar con el siguiente
        }

        try {
          const datosAmigo = await this.perfilService.obtenerPerfil(amigoUid);
          if (datosAmigo) {
            this.amigosData.push(datosAmigo);
          }
        } catch (error) {
          console.error(`Error al cargar amigo con ID ${amigoUid}:`, error);
          // Continuar con el siguiente amigo en caso de error
        }
      }

      this.amigosData.sort((a, b) => a.nombre.localeCompare(b.nombre));
    } catch (err) {
      console.error('Error al cargar amigos:', err);
      this.mostrarExito('No se pudieron cargar los amigos', 'warning');
    } finally {
      this.cargandoAmigos = false;
    }
  }

  async verificarSolicitudAmistad() {
    if (!this.usuario || !this.uidActual) return;

    try {
      const solicitudEnviada = await this.amistadService.obtenerSolicitudEntrePorEstado(
        this.uidActual,
        this.usuario.uid,
        'pendiente'
      );

      if (solicitudEnviada) {
        this.solicitudEnviada = true;
        this.idSolicitud = solicitudEnviada.id ?? null;
        return;
      }

      const solicitudRecibida = await this.amistadService.obtenerSolicitudEntrePorEstado(
        this.usuario.uid,
        this.uidActual,
        'pendiente'
      );

      if (solicitudRecibida) {
        this.solicitudRecibida = true;
        this.idSolicitud = solicitudRecibida.id ?? null;
      }
    } catch (err) {
      console.error('Error al verificar solicitudes de amistad:', err);
    }
  }

  async enviarSolicitudAmistad() {
    if (!this.usuario || !this.uidActual) return;

    try {
      await this.amistadService.enviarSolicitudAmistad(this.uidActual, this.usuario.uid);
      this.solicitudEnviada = true;
      await this.verificarSolicitudAmistad();
      this.mostrarExito('Solicitud enviada', 'exito');
    } catch (err) {
      console.error('Error al enviar solicitud de amistad:', err);
      this.mostrarExito('No se pudo enviar la solicitud', 'warning');
    }
  }

  async cancelarSolicitud() {
    if (!this.idSolicitud) return;

    try {
      await this.amistadService.cancelarSolicitudAmistad(this.idSolicitud);
      this.solicitudEnviada = false;
      this.idSolicitud = null;
      this.mostrarExito('Solicitud cancelada', 'eliminado');
    } catch (err) {
      console.error('Error al cancelar solicitud:', err);
      this.mostrarExito('No se pudo cancelar la solicitud', 'warning');
    }
  }

  async aceptarSolicitud() {
    if (!this.idSolicitud) return;

    try {
      await this.amistadService.aceptarSolicitudAmistad(this.idSolicitud);
      this.solicitudRecibida = false;
      this.idSolicitud = null;
      this.esAmigo = true;
      this.mostrarExito('Solicitud aceptada', 'exito');
    } catch (err) {
      console.error('Error al aceptar solicitud:', err);
      this.mostrarExito('No se pudo aceptar la solicitud', 'warning');
    }
  }

  async rechazarSolicitud() {
    if (!this.idSolicitud) return;

    try {
      await this.amistadService.rechazarSolicitudAmistad(this.idSolicitud);
      this.solicitudRecibida = false;
      this.idSolicitud = null;
      this.mostrarExito('Solicitud rechazada', 'eliminado');
    } catch (err) {
      console.error('Error al rechazar solicitud:', err);
      this.mostrarExito('No se pudo rechazar la solicitud', 'warning');
    }
  }

  eliminarAmigo() {
    if (!this.usuario || !this.uidActual || !this.perfilActual) return;

    this.confirmarAccion(`¿Eliminar a ${this.usuario.nombre} de tus amigos?`, async () => {
      try {
        this.perfilActual!.amigos = this.perfilActual!.amigos?.filter(uid => uid !== this.usuario!.uid) || [];
        await this.perfilService.actualizarPerfil(this.perfilActual!);
        this.esAmigo = false;
        if (this.usuario) {
          this.mostrarExito(`${this.usuario.nombre} eliminado de tus amigos`, 'eliminado');
        }
      } catch (err) {
        console.error('Error al eliminar amigo:', err);
        this.mostrarExito('No se pudo eliminar al amigo', 'warning');
      }
    });
  }


  esAmistadComun(uidAmigo: string): boolean {
    return this.perfilActual?.amigos?.includes(uidAmigo) || false;
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
    return date.toLocaleString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(',', '');
  }

  mostrarExito(mensaje: string, tipo: 'exito' | 'eliminado' | 'warning' = 'exito') {
    this.mensajePopup = mensaje;
    this.tipoPopup = tipo;
    this.mostrarPopup = true;
    setTimeout(() => this.mostrarPopup = false, 3000);
  }

  confirmarAccion(mensaje: string, accion: () => void) {
    this.mensajeConfirmacion = mensaje;
    this.accionConfirmada = accion;
    this.mostrarConfirmacion = true;
  }

  onConfirmar() {
    if (this.accionConfirmada) {
      this.accionConfirmada();
      this.accionConfirmada = null;
    }
    this.mostrarConfirmacion = false;
  }

  onCancelar() {
    this.mostrarConfirmacion = false;
    this.accionConfirmada = null;
  }

}
