import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { Usuario } from '../../../../models/usuario.model';
import { Ruta } from '../../../../models/ruta.model';
import { PerfilService } from '../../services/perfil.service';
import { RutasService } from '../../../rutas/services/rutas.service';
import { AmistadService } from '../../services/amistad.service';
import { Timestamp } from 'firebase/firestore';

@Component({
  standalone: false,
  selector: 'app-mi-perfil',
  templateUrl: './mi-perfil.component.html',
  styleUrls: ['./mi-perfil.component.css']
})
export class MiPerfilComponent implements OnInit, OnDestroy {
  // Datos principales
  usuario: Usuario | null = null;
  rutasPublicas: Ruta[] = [];
  amigosData: Usuario[] = [];

  // Estados de carga
  cargando = true;
  cargandoRutas = false;
  cargandoAmigos = false;
  error = false;
  mensajeError = '';

  // Estado de navegación por tabs
  tabActual: 'info' | 'rutas' | 'amigos' = 'info';

  // Búsqueda
  busquedaAmigos = '';

  // Notificaciones
  solicitudesPendientes = 0;

  // Popups
  mostrarPopup = false;
  mensajePopup = '';
  tipoPopup: 'exito' | 'eliminado' | 'warning' = 'exito';

  mostrarConfirmacion = false;
  mensajeConfirmacion = '';
  accionConfirmada: (() => void) | null = null;

  // Subscripciones
  private subscripciones: Subscription[] = [];

  constructor(
    private perfilService: PerfilService,
    private rutasService: RutasService,
    private amistadService: AmistadService,
    private router: Router
  ) {}

  async ngOnInit() {
    try {
      this.cargando = true;
      const uid = this.perfilService.getUidActual();

      if (!uid) {
        // Usuario no autenticado, redirigir a login
        this.router.navigate(['/auth/login']);
        return;
      }

      // Cargar perfil de usuario
      this.usuario = await this.perfilService.obtenerPerfil(uid);

      if (!this.usuario) {
        // Si no existe el perfil, crearlo
        this.usuario = await this.perfilService.crearPerfilSiNoExiste(uid);
      }

      // Cargar rutas públicas
      this.cargarRutas(uid);

      // Si hay amigos, cargarlos
      if (this.usuario.amigos && this.usuario.amigos.length > 0) {
        this.cargarDatosAmigos();
      }
    } catch (err) {
      console.error('Error al cargar perfil:', err);
      this.error = true;
      this.mensajeError = 'No se pudo cargar tu perfil. Por favor, intenta de nuevo.';
    } finally {
      this.cargando = false;
    }
  }

  ngOnDestroy() {
    // Cancelar todas las subscripciones para evitar memory leaks
    this.subscripciones.forEach(sub => sub.unsubscribe());
  }

  // NAVEGACIÓN
  cambiarTab(tab: 'info' | 'rutas' | 'amigos') {
    this.tabActual = tab;

    // Si cambiamos a la tab de rutas o amigos y no están cargados, cargarlos
    if (tab === 'rutas' && this.rutasPublicas.length === 0) {
      const uid = this.perfilService.getUidActual();
      if (uid) this.cargarRutas(uid);
    } else if (tab === 'amigos' && this.amigosData.length === 0 && this.usuario?.amigos?.length) {
      this.cargarDatosAmigos();
    }
  }

  async reintentar() {
    this.error = false;
    this.mensajeError = '';
    await this.ngOnInit();
  }

  // CARGA DE DATOS
  async cargarRutas(uid: string) {
    try {
      this.cargandoRutas = true;
      this.rutasPublicas = await this.rutasService.cargarRutasPublicasPorUsuario(uid);
    } catch (err) {
      console.error('Error al cargar rutas:', err);
      this.mostrarExito('No se pudieron cargar tus rutas', 'warning');
    } finally {
      this.cargandoRutas = false;
    }
  }

  async cargarDatosAmigos() {
  if (!this.usuario?.amigos || this.usuario.amigos.length === 0) {
    this.amigosData = [];
    return;
  }

  try {
    this.cargandoAmigos = true;
    this.amigosData = [];

    // Obtener datos de todos los amigos
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

    // Ordenar alfabéticamente
    this.amigosData.sort((a, b) => a.nombre.localeCompare(b.nombre));
  } catch (err) {
    console.error('Error al cargar amigos:', err);
    this.mostrarExito('No se pudieron cargar tus amigos', 'warning');
  } finally {
    this.cargandoAmigos = false;
  }
}

  // BÚSQUEDA DE AMIGOS
  buscarAmigos() {
    if (!this.busquedaAmigos.trim()) {
      return this.amigosData; // Mostrar todos los amigos si no hay búsqueda
    }

    const terminoBusqueda = this.busquedaAmigos.toLowerCase().trim();

    // Filtrar amigos por nombre o email
    return this.amigosData.filter(amigo =>
      amigo.nombre.toLowerCase().includes(terminoBusqueda) ||
      (amigo.email && amigo.email.toLowerCase().includes(terminoBusqueda))
    );
  }

  // GESTIÓN DE AMIGOS
  eliminarAmigo(amigo: Usuario) {
    this.confirmarAccion(`¿Eliminar a ${amigo.nombre} de tus amigos?`, async () => {
      if (!this.usuario || !this.usuario.amigos) return;

      try {
        // Eliminar UID del amigo del array
        this.usuario.amigos = this.usuario.amigos.filter(uid => uid !== amigo.uid);
        await this.perfilService.actualizarPerfil(this.usuario);

        // Actualizar lista de amigos
        this.amigosData = this.amigosData.filter(a => a.uid !== amigo.uid);

        this.mostrarExito(`${amigo.nombre} eliminado de tus amigos`, 'eliminado');
      } catch (err) {
        console.error('Error al eliminar amigo:', err);
        this.mostrarExito('No se pudo eliminar al amigo', 'warning');
      }
    });
  }

  // UTILIDADES
  formatFecha(fecha: Timestamp | Date | string | any): string {
    if (!fecha) return '';

    let date: Date;

    if (fecha instanceof Date) {
      date = fecha;
    } else if (typeof fecha === 'string') {
      date = new Date(fecha);
    } else if (fecha.toDate) {
      date = fecha.toDate();
    } else {
      return '';
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

  // GESTIÓN DE POPUPS
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
