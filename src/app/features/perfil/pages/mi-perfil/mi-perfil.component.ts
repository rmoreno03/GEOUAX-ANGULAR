import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { Usuario } from '../../../../models/usuario.model';
import { Ruta } from '../../../../models/ruta.model';
import { PerfilService } from '../../services/perfil.service';
import { RutasService } from '../../../rutas/services/rutas.service';
import { SubirArchivosService } from '../../services/subir-archivos.service';
import { NotificacionesService } from '../../services/notificaciones.service';
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
  cargandoUsuarios = false;
  guardando = false;

  // Estados de error y éxito
  error = false;
  mensajeError = '';
  perfilActualizado = false;

  // Formulario
  perfilForm: FormGroup;

  // Estado de navegación por tabs
  tabActual: 'info' | 'rutas' | 'amigos' = 'info';

  // Estado de modales
  mostrarModalFoto = false;
  mostrarModalBusqueda = false;

  // Gestión de imágenes
  nuevoArchivo: File | null = null;
  previewFotoUrl: string | null = null;

  // Búsqueda
  busquedaAmigos = '';
  busquedaUsuarios = '';
  resultadosBusqueda: Usuario[] = [];

  // Subscripciones
  private subscripciones: Subscription[] = [];

  constructor(
    private perfilService: PerfilService,
    private rutasService: RutasService,
    private subirArchivosService: SubirArchivosService,
    private notificacionesService: NotificacionesService,
    private fb: FormBuilder,
    private router: Router
  ) {
    // Inicializar formulario
    this.perfilForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      biografia: ['', [Validators.maxLength(280)]]
    });
  }

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

      // Actualizar formulario con datos del usuario
      this.perfilForm.patchValue({
        nombre: this.usuario.nombre,
        biografia: this.usuario.biografia || ''
      });

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

  // FORMULARIO DE PERFIL
  async guardar() {
    if (this.perfilForm.invalid || !this.usuario) {
      return;
    }

    try {
      this.guardando = true;

      // Actualizar datos del usuario
      this.usuario.nombre = this.perfilForm.value.nombre;
      this.usuario.biografia = this.perfilForm.value.biografia;

      // Guardar en Firestore
      await this.perfilService.actualizarPerfil(this.usuario);

      // Mostrar mensaje de éxito
      this.perfilActualizado = true;
      setTimeout(() => this.perfilActualizado = false, 3000);

      // Notificar al usuario
      this.notificacionesService.mostrarExito('Perfil actualizado correctamente');
    } catch (err) {
      console.error('Error al actualizar perfil:', err);
      this.notificacionesService.mostrarError('No se pudo actualizar el perfil');
    } finally {
      this.guardando = false;
    }
  }

  reiniciarFormulario() {
    // Restaurar valores originales del formulario
    if (this.usuario) {
      this.perfilForm.patchValue({
        nombre: this.usuario.nombre,
        biografia: this.usuario.biografia || ''
      });
    }
  }

  get nombreInvalido(): boolean {
    const control = this.perfilForm.get('nombre');
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  // CARGA DE DATOS
  async cargarRutas(uid: string) {
    try {
      this.cargandoRutas = true;
      this.rutasPublicas = await this.rutasService.cargarRutasPublicasPorUsuario(uid);
    } catch (err) {
      console.error('Error al cargar rutas:', err);
      this.notificacionesService.mostrarError('No se pudieron cargar tus rutas');
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
        const datosAmigo = await this.perfilService.obtenerPerfil(amigoUid);
        if (datosAmigo) {
          this.amigosData.push(datosAmigo);
        }
      }

      // Ordenar alfabéticamente
      this.amigosData.sort((a, b) => a.nombre.localeCompare(b.nombre));
    } catch (err) {
      console.error('Error al cargar amigos:', err);
      this.notificacionesService.mostrarError('No se pudieron cargar tus amigos');
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
      const uidActual = this.perfilService.getUidActual();
      this.resultadosBusqueda = this.resultadosBusqueda.filter(u => u.uid !== uidActual);
    } catch (err) {
      console.error('Error al buscar usuarios:', err);
      this.notificacionesService.mostrarError('Error al buscar usuarios');
    } finally {
      this.cargandoUsuarios = false;
    }
  }

  // GESTIÓN DE AMIGOS
  esAmigo(uid: string): boolean {
    return !!this.usuario?.amigos && this.usuario.amigos.includes(uid);
  }

  async agregarAmigo(amigo: Usuario) {
    if (!this.usuario) return;

    try {
      // Crear array de amigos si no existe
      if (!this.usuario.amigos) {
        this.usuario.amigos = [];
      }

      // Añadir amigo si no está ya en la lista
      if (!this.usuario.amigos.includes(amigo.uid)) {
        this.usuario.amigos.push(amigo.uid);
        await this.perfilService.actualizarPerfil(this.usuario);

        // Actualizar lista de amigos
        this.amigosData.push(amigo);
        this.amigosData.sort((a, b) => a.nombre.localeCompare(b.nombre));

        this.notificacionesService.mostrarExito(`${amigo.nombre} añadido a tus amigos`);
      }
    } catch (err) {
      console.error('Error al añadir amigo:', err);
      this.notificacionesService.mostrarError('No se pudo añadir al amigo');
    }
  }

  async eliminarAmigo(amigo: Usuario) {
    if (!this.usuario || !this.usuario.amigos) return;

    if (confirm(`¿Eliminar a ${amigo.nombre} de tus amigos?`)) {
      try {
        // Eliminar UID del amigo del array
        this.usuario.amigos = this.usuario.amigos.filter(uid => uid !== amigo.uid);
        await this.perfilService.actualizarPerfil(this.usuario);

        // Actualizar lista de amigos
        this.amigosData = this.amigosData.filter(a => a.uid !== amigo.uid);

        this.notificacionesService.mostrarExito(`${amigo.nombre} eliminado de tus amigos`);
      } catch (err) {
        console.error('Error al eliminar amigo:', err);
        this.notificacionesService.mostrarError('No se pudo eliminar al amigo');
      }
    }
  }

  // GESTIÓN DE FOTO DE PERFIL
  abrirSelectorFoto() {
    this.mostrarModalFoto = true;
    this.nuevoArchivo = null;
    this.previewFotoUrl = null;
  }

  cerrarModal() {
    this.mostrarModalFoto = false;
    this.nuevoArchivo = null;
    this.previewFotoUrl = null;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        this.notificacionesService.mostrarError('El archivo debe ser una imagen');
        return;
      }

      // Validar tamaño máximo (2 MB)
      if (file.size > 2 * 1024 * 1024) {
        this.notificacionesService.mostrarError('La imagen no debe superar los 2 MB');
        return;
      }

      this.nuevoArchivo = file;

      // Crear vista previa
      const reader = new FileReader();
      reader.onload = () => {
        this.previewFotoUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  async subirFoto() {
    if (!this.nuevoArchivo || !this.usuario) {
      return;
    }

    try {
      this.guardando = true;

      // Subir archivo a Firebase Storage
      const ruta = `perfiles/${this.usuario.uid}`;
      const url = await this.subirArchivosService.subirArchivo(ruta, this.nuevoArchivo);

      // Actualizar URL en perfil
      this.usuario.fotoUrl = url;
      await this.perfilService.actualizarPerfil(this.usuario);

      this.notificacionesService.mostrarExito('Foto de perfil actualizada');
      this.cerrarModal();
    } catch (err) {
      console.error('Error al subir foto:', err);
      this.notificacionesService.mostrarError('No se pudo actualizar la foto');
    } finally {
      this.guardando = false;
    }
  }

  // GESTIÓN DEL MODAL DE BÚSQUEDA
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
}
