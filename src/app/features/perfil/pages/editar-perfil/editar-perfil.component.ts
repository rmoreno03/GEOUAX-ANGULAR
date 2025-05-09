import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { Usuario } from '../../../../models/usuario.model';
import { PerfilService } from '../../services/perfil.service';
import { SubirArchivosService } from '../../services/subir-archivos.service';
import { AuthService } from '../../../../auth/services/auth.service';

@Component({
  standalone: false,
  selector: 'app-editar-perfil',
  templateUrl: './editar-perfil.component.html',
  styleUrls: ['./editar-perfil.component.css']
})
export class EditarPerfilComponent implements OnInit {
  // Datos principales
  usuario: Usuario | null = null;
  esAdmin = false;

  // Estados de carga
  cargando = true;
  guardando = false;
  guardandoFoto = false;
  error = false;
  mensajeError = '';

  // Formulario
  perfilForm: FormGroup;

  // Estado de modales
  mostrarModalFoto = false;

  // Gestión de imágenes
  nuevoArchivo: File | null = null;
  previewFotoUrl: string | null = null;

  // Popups
  mostrarPopup = false;
  mensajePopup = '';
  tipoPopup: 'exito' | 'eliminado' | 'warning' = 'exito';

  constructor(
    private perfilService: PerfilService,
    private subirArchivosService: SubirArchivosService,
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {
    // Inicializar formulario
    this.perfilForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      biografia: ['', [Validators.maxLength(280)]],
      phoneNumber: [''],
      rol: ['usuario']
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

      // Verificar si el usuario es administrador
      const perfilActual = await this.perfilService.getUserProfileSnapshot();
      this.esAdmin = perfilActual?.rol === 'admin';

      // Cargar perfil de usuario
      this.usuario = await this.perfilService.obtenerPerfil(uid);

      if (!this.usuario) {
        // Si no existe el perfil, crearlo
        this.usuario = await this.perfilService.crearPerfilSiNoExiste(uid);
      }

      // Actualizar formulario con datos del usuario
      this.actualizarFormulario();

    } catch (err) {
      console.error('Error al cargar perfil:', err);
      this.error = true;
      this.mensajeError = 'No se pudo cargar tu perfil. Por favor, intenta de nuevo.';
    } finally {
      this.cargando = false;
    }
  }

  actualizarFormulario() {
    if (!this.usuario) return;

    this.perfilForm.patchValue({
      nombre: this.usuario.nombre || '',
      biografia: this.usuario.biografia || '',
      phoneNumber: this.usuario.phoneNumber || '',
      rol: this.usuario.rol || 'usuario'
    });
  }

  async guardar() {
    if (this.perfilForm.invalid || !this.usuario) {
      return;
    }

    try {
      this.guardando = true;

      // Actualizar datos del usuario
      this.usuario.nombre = this.perfilForm.value.nombre;
      this.usuario.biografia = this.perfilForm.value.biografia;
      this.usuario.phoneNumber = this.perfilForm.value.phoneNumber;

      // Solo actualizar el rol si el usuario es administrador
      if (this.esAdmin) {
        this.usuario.rol = this.perfilForm.value.rol;
      }

      // Guardar en Firestore
      await this.perfilService.actualizarPerfil(this.usuario);

      // Mostrar mensaje y redirigir
      this.mostrarExito('Perfil actualizado correctamente');
      setTimeout(() => {
        this.router.navigate(['/perfil']);
      }, 1500);

    } catch (err) {
      console.error('Error al actualizar perfil:', err);
      this.mostrarExito('No se pudo actualizar el perfil', 'warning');
    } finally {
      this.guardando = false;
    }
  }

  reiniciarFormulario() {
    // Restaurar valores originales del formulario
    this.actualizarFormulario();
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
        this.mostrarExito('El archivo debe ser una imagen (jpg, png, gif, etc.)', 'warning');
        return;
      }

      // Validar tamaño máximo (2 MB)
      if (file.size > 2 * 1024 * 1024) {
        this.mostrarExito('La imagen no debe superar los 2 MB', 'warning');
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
      this.guardandoFoto = true;

      // Subir archivo a Firebase Storage
      const ruta = `perfiles/${this.usuario.uid}`;
      const url = await this.subirArchivosService.subirArchivo(ruta, this.nuevoArchivo);

      // Actualizar URL en perfil
      this.usuario.fotoUrl = url;
      await this.perfilService.actualizarPerfil(this.usuario);

      // Actualizar también en Auth si es posible
      try {
        const user = this.authService.getCurrentUserNow();
        if (user) {
          await this.authService.updateUserProfile({ photoURL: url });
        }
      } catch (e) {
        console.warn('No se pudo actualizar la foto en Auth, pero sí en Firestore');
      }

      this.mostrarExito('Foto de perfil actualizada correctamente');
      this.cerrarModal();
    } catch (err) {
      console.error('Error al subir foto:', err);
      this.mostrarExito('No se pudo actualizar la foto de perfil', 'warning');
    } finally {
      this.guardandoFoto = false;
    }
  }

  // VALIDACIONES
  get nombreInvalido(): boolean {
    const control = this.perfilForm.get('nombre');
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  // MENSAJES
  mostrarExito(mensaje: string, tipo: 'exito' | 'eliminado' | 'warning' = 'exito') {
    this.mensajePopup = mensaje;
    this.tipoPopup = tipo;
    this.mostrarPopup = true;
    setTimeout(() => this.mostrarPopup = false, 3000);
  }

  async reintentar() {
    this.error = false;
    this.mensajeError = '';
    await this.ngOnInit();
  }
}
