import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  standalone: false,
  selector: 'app-nuevo-usuario',
  templateUrl: './nuevo-usuario.component.html',
  styleUrls: ['./nuevo-usuario.component.css']
})
export class NuevoUsuarioComponent implements OnInit {
  // Estados de la interfaz
  loading = false;
  submitting = false;
  error = '';
  success = false;

  // Formulario de nuevo usuario
  usuarioForm: FormGroup;

  // Lista de roles disponibles
  roles = [
    { id: 'admin', nombre: 'Administrador', descripcion: 'Acceso completo a todas las funcionalidades del sistema' },
    { id: 'moderador', nombre: 'Moderador', descripcion: 'Puede moderar contenido y usuarios, sin acceso a configuración' },
    { id: 'editor', nombre: 'Editor', descripcion: 'Puede crear y editar contenido, limitado a sus propios datos' },
    { id: 'usuario', nombre: 'Usuario', descripcion: 'Acceso básico a la plataforma' }
  ];

  // Opciones de permisos
  permisos = [
    { id: 'crear_rutas', nombre: 'Crear rutas', seleccionado: true },
    { id: 'editar_rutas', nombre: 'Editar rutas', seleccionado: true },
    { id: 'eliminar_rutas', nombre: 'Eliminar rutas', seleccionado: false },
    { id: 'crear_puntos', nombre: 'Crear puntos de interés', seleccionado: true },
    { id: 'editar_puntos', nombre: 'Editar puntos de interés', seleccionado: true },
    { id: 'eliminar_puntos', nombre: 'Eliminar puntos de interés', seleccionado: false },
    { id: 'crear_comentarios', nombre: 'Crear comentarios', seleccionado: true },
    { id: 'moderar_comentarios', nombre: 'Moderar comentarios', seleccionado: false },
    { id: 'gestionar_usuarios', nombre: 'Gestionar usuarios', seleccionado: false }
  ];

  // Mostrar contraseña
  mostrarPassword = false;

  constructor(private fb: FormBuilder) {
    this.usuarioForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      apellidos: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      telefono: ['', [Validators.pattern('^\\+?[0-9]{9,15}$')]],
      rol: ['usuario', Validators.required],
      activo: [true],
      notificaciones: [true],
      permisos: [this.getPermisosSeleccionados()]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Al iniciar, actualizamos los permisos según el rol seleccionado
    this.actualizarPermisosPorRol(this.usuarioForm.get('rol')?.value);

    // Nos suscribimos a cambios en el rol para actualizar los permisos
    this.usuarioForm.get('rol')?.valueChanges.subscribe(rol => {
      this.actualizarPermisosPorRol(rol);
    });
  }

  // Validador para comprobar que las contraseñas coinciden
  passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      formGroup.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      formGroup.get('confirmPassword')?.setErrors(null);
      return null;
    }
  }

  // Método para obtener los IDs de los permisos seleccionados
  getPermisosSeleccionados(): string[] {
    return this.permisos
      .filter(permiso => permiso.seleccionado)
      .map(permiso => permiso.id);
  }

  // Método para actualizar los permisos según el rol seleccionado
  actualizarPermisosPorRol(rol: string): void {
    // Resetear todos los permisos
    this.permisos.forEach(permiso => permiso.seleccionado = false);

    // Asignar permisos según el rol
    switch(rol) {
      case 'admin':
        // Administrador tiene todos los permisos
        this.permisos.forEach(permiso => permiso.seleccionado = true);
        break;
      case 'moderador':
        // Moderador tiene permisos de moderación
        this.permisos.find(p => p.id === 'crear_rutas')!.seleccionado = true;
        this.permisos.find(p => p.id === 'editar_rutas')!.seleccionado = true;
        this.permisos.find(p => p.id === 'crear_puntos')!.seleccionado = true;
        this.permisos.find(p => p.id === 'editar_puntos')!.seleccionado = true;
        this.permisos.find(p => p.id === 'crear_comentarios')!.seleccionado = true;
        this.permisos.find(p => p.id === 'moderar_comentarios')!.seleccionado = true;
        break;
      case 'editor':
        // Editor tiene permisos de edición
        this.permisos.find(p => p.id === 'crear_rutas')!.seleccionado = true;
        this.permisos.find(p => p.id === 'editar_rutas')!.seleccionado = true;
        this.permisos.find(p => p.id === 'crear_puntos')!.seleccionado = true;
        this.permisos.find(p => p.id === 'editar_puntos')!.seleccionado = true;
        this.permisos.find(p => p.id === 'crear_comentarios')!.seleccionado = true;
        break;
      case 'usuario':
        // Usuario tiene permisos básicos
        this.permisos.find(p => p.id === 'crear_rutas')!.seleccionado = true;
        this.permisos.find(p => p.id === 'crear_puntos')!.seleccionado = true;
        this.permisos.find(p => p.id === 'crear_comentarios')!.seleccionado = true;
        break;
    }

    // Actualizar el valor en el formulario
    this.usuarioForm.get('permisos')?.setValue(this.getPermisosSeleccionados());
  }

  // Método para alternar un permiso individual
  togglePermiso(permisoId: string): void {
    const permiso = this.permisos.find(p => p.id === permisoId);
    if (permiso) {
      permiso.seleccionado = !permiso.seleccionado;
      this.usuarioForm.get('permisos')?.setValue(this.getPermisosSeleccionados());
    }
  }

  // Método para enviar el formulario
  onSubmit(): void {
    if (this.usuarioForm.invalid) {
      // Marcamos todos los campos como tocados para mostrar los errores
      Object.keys(this.usuarioForm.controls).forEach(key => {
        const control = this.usuarioForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.submitting = true;

    // Simulación de envío
    setTimeout(() => {
      console.log('Formulario enviado:', this.usuarioForm.value);
      this.submitting = false;
      this.success = true;

      // Reseteamos el formulario después de mostrar el mensaje de éxito
      setTimeout(() => {
        this.usuarioForm.reset({
          rol: 'usuario',
          activo: true,
          notificaciones: true,
          permisos: this.getPermisosSeleccionados()
        });
        this.success = false;
      }, 3000);
    }, 1500);
  }

  // Método para comprobar si un campo es inválido y ha sido tocado
  isFieldInvalid(fieldName: string): boolean {
    const field = this.usuarioForm.get(fieldName);
    return !!field && field.invalid && (field.dirty || field.touched);
  }

  // Método para generar una contraseña aleatoria
  generarPassword(): void {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let password = '';

    // Generar una contraseña de 12 caracteres
    for (let i = 0; i < 12; i++) {
      const indice = Math.floor(Math.random() * caracteres.length);
      password += caracteres.charAt(indice);
    }

    this.usuarioForm.get('password')?.setValue(password);
    this.usuarioForm.get('confirmPassword')?.setValue(password);
    this.mostrarPassword = true;
  }

  // Método para alternar la visibilidad de la contraseña
  toggleMostrarPassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  getRolDescripcion() {
    throw new Error('Method not implemented.');
  }
}
