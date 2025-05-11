import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  Firestore,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  Timestamp
} from '@angular/fire/firestore';
import { Usuario } from '../../../../models/usuario.model';

@Component({
  selector: 'app-user-edit',
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.css'],
  standalone: false
})
export class UserEditComponent implements OnInit {
  user: Usuario | null = null;
  userForm: FormGroup;
  loading = true;
  saving = false;
  deleting = false;
  error: string | null = null;
  lastSaved: Date | null = null;
  showDeleteModal = false;

  // Permisos
  canEditEmail = true;
  canEditRole = true;
  canDeleteUser = true;

  // Estado original para detectar cambios
  originalFormValue: any;

  // Valores originales para mostrar comparación
  originalValues: any = {};

  // Toggle para mostrar/ocultar valores originales
  showOriginalValues = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private firestore: Firestore
  ) {
    this.userForm = this.createForm();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadUser(params['id']);
      }
    });
  }

  createForm(): FormGroup {
    const form = this.formBuilder.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      biografia: ['', [Validators.maxLength(500)]],
      rol: ['usuario', Validators.required],
      estaActivo: [true],
      emailVerified: [false],
      ajustes: this.formBuilder.group({
        privacidad: this.formBuilder.group({
          perfilPublico: [false],
          mostrarEmail: [false],
          mostrarAmigos: [false],
          notificacionesEmail: [true]
        }),
        mapa: this.formBuilder.group({
          tipoMapa: ['satelite'],
          unidades: ['km'],
          zoom: [13]
        })
      })
    });

    // Detectar cambios en el formulario
    form.valueChanges.subscribe(() => {
      this.checkForChanges();
    });

    return form;
  }

  async loadUser(userId: string): Promise<void> {
    try {
      this.loading = true;
      this.error = null;

      const userRef = doc(this.firestore, 'usuarios', userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        this.error = 'Usuario no encontrado';
        this.user = null;
      } else {
        const userData = userSnap.data();
        this.user = {
          uid: userSnap.id,
          ...userData
        } as Usuario;

        this.populateForm();
        this.checkPermissions();

        // Guardar el estado original y los valores originales
        this.originalFormValue = this.userForm.value;
        this.saveOriginalValues();
      }
    } catch (err) {
      console.error('Error al cargar usuario:', err);
      this.error = 'Error al cargar la información del usuario';
    } finally {
      this.loading = false;
    }
  }

  populateForm(): void {
    if (!this.user) return;

    this.userForm.patchValue({
      nombre: this.user.nombre || '',
      email: this.user.email || '',
      phoneNumber: this.user.phoneNumber || '',
      biografia: this.user.biografia || '',
      rol: this.user.rol || 'usuario',
      estaActivo: this.user.estaActivo ?? true,
      emailVerified: this.user.emailVerified ?? false,
      ajustes: {
        privacidad: {
          perfilPublico: this.user.ajustes?.privacidad?.perfilPublico ?? false,
          mostrarEmail: this.user.ajustes?.privacidad?.mostrarEmail ?? false,
          mostrarAmigos: this.user.ajustes?.privacidad?.mostrarAmigos ?? false,
          notificacionesEmail: this.user.ajustes?.privacidad?.notificacionesEmail ?? true
        },
        mapa: {
          tipoMapa: this.user.ajustes?.mapa?.tipoMapa || 'satelite',
          unidades: this.user.ajustes?.mapa?.unidades || 'km',
          zoom: this.user.ajustes?.mapa?.zoom || 13
        }
      }
    });
  }

  saveOriginalValues(): void {
    if (!this.user) return;

    this.originalValues = {
      nombre: this.user.nombre || 'Sin nombre',
      email: this.user.email || 'Sin email',
      phoneNumber: this.user.phoneNumber || 'Sin teléfono',
      biografia: this.user.biografia || 'Sin biografía',
      rol: this.user.rol || 'usuario',
      estaActivo: this.user.estaActivo ? 'Activo' : 'Inactivo',
      emailVerified: this.user.emailVerified ? 'Verificado' : 'No verificado',
      privacidad: {
        perfilPublico: this.user.ajustes?.privacidad?.perfilPublico ? 'Sí' : 'No',
        mostrarEmail: this.user.ajustes?.privacidad?.mostrarEmail ? 'Sí' : 'No',
        mostrarAmigos: this.user.ajustes?.privacidad?.mostrarAmigos ? 'Sí' : 'No',
        notificacionesEmail: this.user.ajustes?.privacidad?.notificacionesEmail ? 'Activadas' : 'Desactivadas'
      }
    };
  }

  toggleOriginalValues(): void {
    this.showOriginalValues = !this.showOriginalValues;
  }

  checkPermissions(): void {
    if (!this.user) return;

    // No permitir editar email para usuarios con auth social
    this.canEditEmail = !this.user.authProvider || this.user.authProvider === 'email';
  }

  checkForChanges(): void {
    if (!this.originalFormValue) return;
  }

  get hasChanges(): boolean {
    if (!this.originalFormValue) return false;
    return JSON.stringify(this.userForm.value) !== JSON.stringify(this.originalFormValue);
  }

  getChangedFields(): string[] {
    if (!this.originalFormValue) return [];

    const changed: string[] = [];
    const current = this.userForm.value;
    const original = this.originalFormValue;

    // Comparar campos simples
    if (current.nombre !== original.nombre) changed.push('Nombre');
    if (current.email !== original.email) changed.push('Email');
    if (current.phoneNumber !== original.phoneNumber) changed.push('Teléfono');
    if (current.biografia !== original.biografia) changed.push('Biografía');
    if (current.rol !== original.rol) changed.push('Rol');
    if (current.estaActivo !== original.estaActivo) changed.push('Estado');
    if (current.emailVerified !== original.emailVerified) changed.push('Email Verificado');

    // Comparar ajustes de privacidad
    if (JSON.stringify(current.ajustes.privacidad) !== JSON.stringify(original.ajustes.privacidad)) {
      changed.push('Configuración de Privacidad');
    }

    return changed;
  }

  async onSubmit(): Promise<void> {
    if (this.userForm.invalid || !this.user) return;

    try {
      this.saving = true;

      // Preparar los datos para actualizar
      const updateData: Partial<Usuario> = {
        nombre: this.userForm.get('nombre')?.value,
        email: this.userForm.get('email')?.value,
        phoneNumber: this.userForm.get('phoneNumber')?.value || null,
        biografia: this.userForm.get('biografia')?.value || null,
        rol: this.userForm.get('rol')?.value,
        estaActivo: this.userForm.get('estaActivo')?.value,
        emailVerified: this.userForm.get('emailVerified')?.value,
        ajustes: this.userForm.get('ajustes')?.value,
        ultimaConexion: Timestamp.now()
      };

      // Actualizar en Firestore
      const userRef = doc(this.firestore, 'usuarios', this.user.uid);
      await updateDoc(userRef, updateData);

      // Actualizar el estado original
      this.originalFormValue = this.userForm.value;
      this.lastSaved = new Date();

      // Mensaje de éxito
      alert('Usuario actualizado correctamente');

    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      alert('Error al actualizar el usuario. Por favor, intenta de nuevo.');
    } finally {
      this.saving = false;
    }
  }

  formatFecha(fecha: any): string {
    if (!fecha) return 'No disponible';

    try {
      const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  }

  getProviderIcon(provider: string): string {
    const icons: Record<string, string> = {
      'google': 'fa-google',
      'facebook': 'fa-facebook-f',
      'twitter': 'fa-twitter',
      'email': 'fa-envelope'
    };
    return icons[provider] || 'fa-user';
  }

  getProviderName(provider: string): string {
    const names: Record<string, string> = {
      'google': 'Google',
      'facebook': 'Facebook',
      'twitter': 'Twitter',
      'email': 'Email'
    };
    return names[provider] || 'Desconocido';
  }

  cancel(): void {
    if (this.hasChanges) {
      if (confirm('Hay cambios sin guardar. ¿Estás seguro de que quieres cancelar?')) {
        this.navigateBack();
      }
    } else {
      this.navigateBack();
    }
  }

  navigateBack(): void {
    if (this.user) {
      this.router.navigate(['/admin/usuarios', this.user.uid]);
    } else {
      this.router.navigate(['/admin/gestion-usuarios']);
    }
  }

  confirmDelete(): void {
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
  }

  async deleteUser(): Promise<void> {
    if (!this.user) return;

    try {
      this.deleting = true;

      const userRef = doc(this.firestore, 'usuarios', this.user.uid);
      await deleteDoc(userRef);

      this.router.navigate(['/admin/gestion-usuarios']);

    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      alert('Error al eliminar el usuario. Por favor, intenta de nuevo.');
    } finally {
      this.deleting = false;
      this.showDeleteModal = false;
    }
  }

  retry(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadUser(params['id']);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.hasChanges) {
      // Aquí podrías mostrar una confirmación
    }
  }
}
