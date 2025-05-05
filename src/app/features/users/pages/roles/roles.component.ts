import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

interface Rol {
  id: string;
  nombre: string;
  descripcion: string;
  usuarios: number;
  permisos: string[];
}

interface Permiso {
  id: string;
  nombre: string;
  categoria: string;
  seleccionado: boolean;
}

@Component({
  standalone: false,
  selector: 'app-roles',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.css']
})
export class RolesComponent implements OnInit {
  loading = false;
  error = '';
  submitting = false;
  success = false;
  editMode = false;

  rolForm: FormGroup;

  roles: Rol[] = [
    {
      id: 'admin',
      nombre: 'Administrador',
      descripcion: 'Acceso completo a todas las funcionalidades del sistema',
      usuarios: 3,
      permisos: [ /* ... */ ]
    },
    // ... otros roles
  ];

  rolSeleccionado: Rol | null = null;

  permisosDisponibles: Permiso[] = [
    { id: 'crear_rutas', nombre: 'Crear rutas', categoria: 'rutas', seleccionado: false },
    // ... otros permisos
  ];

  categoriasPermisos = [
    { id: 'rutas', nombre: 'Rutas' },
    { id: 'puntos', nombre: 'Puntos de interés' },
    { id: 'comentarios', nombre: 'Comentarios' },
    { id: 'usuarios', nombre: 'Usuarios y roles' },
    { id: 'sistema', nombre: 'Sistema' }
  ];

  constructor(private fb: FormBuilder) {
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
    setTimeout(() => this.loading = false, 1200);
  }

  getPermisosPorCategoria(categoria: string): Permiso[] {
    return this.permisosDisponibles.filter(p => p.categoria === categoria);
  }

  tienePermiso(rolId: string, permisoId: string): boolean {
    const rol = this.roles.find(r => r.id === rolId);
    return rol ? rol.permisos.includes(permisoId) : false;
  }

  seleccionarRol(rol: Rol): void {
    this.rolSeleccionado = rol;
    this.editMode = true;
    this.permisosDisponibles.forEach(p => p.seleccionado = rol.permisos.includes(p.id));

    this.rolForm.patchValue({
      id: rol.id,
      nombre: rol.nombre,
      descripcion: rol.descripcion,
      permisos: rol.permisos
    });

    this.rolForm.get('id')?.disable();
  }

  nuevoRol(): void {
    this.rolSeleccionado = null;
    this.editMode = false;
    this.rolForm.reset({ permisos: [] });
    this.rolForm.get('id')?.enable();
    this.permisosDisponibles.forEach(p => p.seleccionado = false);
  }

  togglePermiso(permisoId: string): void {
    const permiso = this.permisosDisponibles.find(p => p.id === permisoId);
    if (permiso) {
      permiso.seleccionado = !permiso.seleccionado;
      this.actualizarPermisosFormulario();
    }
  }

  toggleCategoria(categoriaId: string, seleccionado: boolean): void {
    this.permisosDisponibles
      .filter(p => p.categoria === categoriaId)
      .forEach(p => p.seleccionado = seleccionado);

    this.actualizarPermisosFormulario();
  }

  actualizarPermisosFormulario(): void {
    const seleccionados = this.permisosDisponibles
      .filter(p => p.seleccionado)
      .map(p => p.id);
    this.rolForm.get('permisos')?.setValue(seleccionados);
  }

  onSubmit(): void {
    if (this.rolForm.invalid) {
      Object.keys(this.rolForm.controls).forEach(key => {
        const control = this.rolForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.submitting = true;

    setTimeout(() => {
      console.log('Formulario enviado:', this.rolForm.getRawValue());
      this.submitting = false;
      this.success = true;

      setTimeout(() => {
        this.success = false;
        this.nuevoRol();
      }, 3000);
    }, 1500);
  }

  eliminarRol(rolId: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar este rol?')) {
      console.log('Eliminar rol:', rolId);
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.rolForm.get(fieldName);
    return !!field && field.invalid && (field.dirty || field.touched);
  }

  estanTodosSeleccionados(categoriaId: string): boolean {
    return this.getPermisosPorCategoria(categoriaId).every(p => p.seleccionado);
  }

  hayAlgunoSeleccionado(categoriaId: string): boolean {
    return this.getPermisosPorCategoria(categoriaId).some(p => p.seleccionado);
  }
}
