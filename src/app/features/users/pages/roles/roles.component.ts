import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  standalone: false,
  selector: 'app-roles',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.css']
})
export class RolesComponent implements OnInit {
  // Estados de la interfaz
  loading = false;
  error = '';
  submitting = false;
  success = false;
  editMode = false;

  // Formulario para crear/editar rol
  rolForm: FormGroup;

  // Lista de roles existentes
  roles = [
    {
      id: 'admin',
      nombre: 'Administrador',
      descripcion: 'Acceso completo a todas las funcionalidades del sistema',
      usuarios: 3,
      permisos: [
        'crear_rutas', 'editar_rutas', 'eliminar_rutas',
        'crear_puntos', 'editar_puntos', 'eliminar_puntos',
        'crear_comentarios', 'moderar_comentarios', 'gestionar_usuarios',
        'gestionar_roles', 'ver_estadisticas', 'configuracion_sistema'
      ]
    },
    {
      id: 'moderador',
      nombre: 'Moderador',
      descripcion: 'Puede moderar contenido y usuarios, sin acceso a configuración',
      usuarios: 5,
      permisos: [
        'crear_rutas', 'editar_rutas',
        'crear_puntos', 'editar_puntos',
        'crear_comentarios', 'moderar_comentarios'
      ]
    },
    {
      id: 'editor',
      nombre: 'Editor',
      descripcion: 'Puede crear y editar contenido, limitado a sus propios datos',
      usuarios: 12,
      permisos: [
        'crear_rutas', 'editar_rutas',
        'crear_puntos', 'editar_puntos',
        'crear_comentarios'
      ]
    },
    {
      id: 'usuario',
      nombre: 'Usuario',
      descripcion: 'Acceso básico a la plataforma',
      usuarios: 128,
      permisos: [
        'crear_rutas',
        'crear_puntos',
        'crear_comentarios'
      ]
    }
  ];

  // Rol seleccionado para edición
  rolSeleccionado: any = null;

  // Lista de permisos disponibles en el sistema
  permisosDisponibles = [
    { id: 'crear_rutas', nombre: 'Crear rutas', categoria: 'rutas', seleccionado: false },
    { id: 'editar_rutas', nombre: 'Editar rutas', categoria: 'rutas', seleccionado: false },
    { id: 'eliminar_rutas', nombre: 'Eliminar rutas', categoria: 'rutas', seleccionado: false },
    { id: 'crear_puntos', nombre: 'Crear puntos de interés', categoria: 'puntos', seleccionado: false },
    { id: 'editar_puntos', nombre: 'Editar puntos de interés', categoria: 'puntos', seleccionado: false },
    { id: 'eliminar_puntos', nombre: 'Eliminar puntos de interés', categoria: 'puntos', seleccionado: false },
    { id: 'crear_comentarios', nombre: 'Crear comentarios', categoria: 'comentarios', seleccionado: false },
    { id: 'moderar_comentarios', nombre: 'Moderar comentarios', categoria: 'comentarios', seleccionado: false },
    { id: 'gestionar_usuarios', nombre: 'Gestionar usuarios', categoria: 'usuarios', seleccionado: false },
    { id: 'gestionar_roles', nombre: 'Gestionar roles', categoria: 'usuarios', seleccionado: false },
    { id: 'ver_estadisticas', nombre: 'Ver estadísticas', categoria: 'sistema', seleccionado: false },
    { id: 'configuracion_sistema', nombre: 'Configuración del sistema', categoria: 'sistema', seleccionado: false }
  ];

  // Categorías de permisos para mostrarlos agrupados
  categoriasPermisos = [
    { id: 'rutas', nombre: 'Rutas' },
    { id: 'puntos', nombre: 'Puntos de interés' },
    { id: 'comentarios', nombre: 'Comentarios' },
    { id: 'usuarios', nombre: 'Usuarios y roles' },
    { id: 'sistema', nombre: 'Sistema' }
  ];

  constructor(private fb: FormBuilder) {
    // Inicializar formulario
    this.rolForm = this.fb.group({
      id: ['', [Validators.required, Validators.pattern('^[a-z0-9_-]+$')]],
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      descripcion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]],
      permisos: [[]]
    });
  }

  ngOnInit(): void {
    this.cargarRoles();
  }

  cargarRoles(): void {
    this.loading = true;

    // Simulación de carga de datos
    setTimeout(() => {
      // Aquí iría la petición al servicio para cargar datos reales
      this.loading = false;
    }, 1200);
  }

  // Método para obtener permisos por categoría
  getPermisosPorCategoria(categoria: string): any[] {
    return this.permisosDisponibles.filter(permiso => permiso.categoria === categoria);
  }

  // Método para comprobar si un rol tiene un permiso específico
  tienePermiso(rolId: string, permisoId: string): boolean {
    const rol = this.roles.find(r => r.id === rolId);
    return rol ? rol.permisos.includes(permisoId) : false;
  }

  // Método para seleccionar un rol para edición
  seleccionarRol(rol: any): void {
    this.rolSeleccionado = rol;
    this.editMode = true;

    // Actualizar estado de los permisos disponibles
    this.permisosDisponibles.forEach(permiso => {
      permiso.seleccionado = rol.permisos.includes(permiso.id);
    });

    // Actualizar formulario con los datos del rol
    this.rolForm.patchValue({
      id: rol.id,
      nombre: rol.nombre,
      descripcion: rol.descripcion,
      permisos: rol.permisos
    });

    // Deshabilitar campo ID en modo edición
    this.rolForm.get('id')?.disable();
  }

  // Método para crear un nuevo rol
  nuevoRol(): void {
    this.rolSeleccionado = null;
    this.editMode = false;

    // Resetear formulario
    this.rolForm.reset({
      permisos: []
    });

    // Habilitar campo ID para nuevo rol
    this.rolForm.get('id')?.enable();

    // Resetear permisos
    this.permisosDisponibles.forEach(permiso => {
      permiso.seleccionado = false;
    });
  }

  // Método para alternar permiso
  togglePermiso(permisoId: string): void {
    const permiso = this.permisosDisponibles.find(p => p.id === permisoId);
    if (permiso) {
      permiso.seleccionado = !permiso.seleccionado;
      this.actualizarPermisosFormulario();
    }
  }

  // Método para alternar todos los permisos de una categoría
  toggleCategoria(categoriaId: string, seleccionado: boolean): void {
    this.permisosDisponibles
      .filter(permiso => permiso.categoria === categoriaId)
      .forEach(permiso => permiso.seleccionado = seleccionado);

    this.actualizarPermisosFormulario();
  }

  // Método para actualizar los permisos en el formulario
  actualizarPermisosFormulario(): void {
    const permisosSeleccionados = this.permisosDisponibles
      .filter(permiso => permiso.seleccionado)
      .map(permiso => permiso.id);

    this.rolForm.get('permisos')?.setValue(permisosSeleccionados);
  }

  // Método para enviar el formulario
  onSubmit(): void {
    if (this.rolForm.invalid) {
      // Marcar campos como tocados para mostrar errores
      Object.keys(this.rolForm.controls).forEach(key => {
        const control = this.rolForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.submitting = true;

    // Simulación de envío
    setTimeout(() => {
      console.log('Formulario enviado:', this.rolForm.value);
      this.submitting = false;
      this.success = true;

      // Resetear después de mostrar mensaje de éxito
      setTimeout(() => {
        this.success = false;
        this.nuevoRol();
      }, 3000);
    }, 1500);
  }

  // Método para eliminar un rol
  eliminarRol(rolId: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar este rol? Los usuarios asignados a este rol quedarán sin rol.')) {
      // Simulación de eliminación
      console.log('Eliminar rol:', rolId);

      // Aquí iría la lógica para eliminar el rol y reasignar usuarios
    }
  }

  // Método para comprobar si un campo es inválido y ha sido tocado
  isFieldInvalid(fieldName: string): boolean {
    const field = this.rolForm.get(fieldName);
    return !!field && field.invalid && (field.dirty || field.touched);
  }

  // Método para verificar si todos los permisos de una categoría están seleccionados
  estanTodosSeleccionados(categoriaId: string): boolean {
    const permisos = this.getPermisosPorCategoria(categoriaId);
    return permisos.every(permiso => permiso.seleccionado);
  }

  // Método para verificar si algún permiso de una categoría está seleccionado
  hayAlgunoSeleccionado(categoriaId: string): boolean {
    const permisos = this.getPermisosPorCategoria(categoriaId);
    return permisos.some(permiso => permiso.seleccionado);
  }
}
