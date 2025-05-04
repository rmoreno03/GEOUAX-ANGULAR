import { Component, OnInit } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-lista-usuarios',
  templateUrl: './lista-usuarios.component.html',
  styleUrls: ['./lista-usuarios.component.css']
})
export class ListaUsuariosComponent implements OnInit {
  // Estados de la interfaz
  loading = false;
  error = '';
  filtroTexto = '';
  filtroPor = 'nombre'; // nombre, email, rol

  // Datos simulados de usuarios
  usuarios = [
    {
      id: 1,
      nombre: 'Juan Pérez',
      email: 'juan.perez@ejemplo.com',
      rol: 'Administrador',
      fechaRegistro: new Date('2024-12-15'),
      ultimoAcceso: new Date('2025-04-28'),
      activo: true,
      rutasCreadas: 24,
      puntosRegistrados: 68
    },
    {
      id: 2,
      nombre: 'María García',
      email: 'maria.garcia@ejemplo.com',
      rol: 'Editor',
      fechaRegistro: new Date('2025-01-10'),
      ultimoAcceso: new Date('2025-04-25'),
      activo: true,
      rutasCreadas: 18,
      puntosRegistrados: 42
    },
    {
      id: 3,
      nombre: 'Carlos Rodríguez',
      email: 'carlos.rodriguez@ejemplo.com',
      rol: 'Usuario',
      fechaRegistro: new Date('2025-02-05'),
      ultimoAcceso: new Date('2025-04-27'),
      activo: true,
      rutasCreadas: 12,
      puntosRegistrados: 35
    },
    {
      id: 4,
      nombre: 'Ana Martínez',
      email: 'ana.martinez@ejemplo.com',
      rol: 'Moderador',
      fechaRegistro: new Date('2024-11-20'),
      ultimoAcceso: new Date('2025-04-22'),
      activo: true,
      rutasCreadas: 31,
      puntosRegistrados: 95
    },
    {
      id: 5,
      nombre: 'David López',
      email: 'david.lopez@ejemplo.com',
      rol: 'Usuario',
      fechaRegistro: new Date('2025-03-15'),
      ultimoAcceso: new Date('2025-04-26'),
      activo: true,
      rutasCreadas: 6,
      puntosRegistrados: 14
    }
  ];

  // Columnas a mostrar
  columnas = [
    { nombre: 'nombre', titulo: 'Nombre', visible: true },
    { nombre: 'email', titulo: 'Email', visible: true },
    { nombre: 'rol', titulo: 'Rol', visible: true },
    { nombre: 'fechaRegistro', titulo: 'Fecha Registro', visible: true },
    { nombre: 'ultimoAcceso', titulo: 'Último Acceso', visible: true },
    { nombre: 'rutasCreadas', titulo: 'Rutas', visible: true },
    { nombre: 'puntosRegistrados', titulo: 'Puntos', visible: true },
    { nombre: 'acciones', titulo: 'Acciones', visible: true }
  ];

  constructor() { }

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.loading = true;

    // Simulación de carga de datos
    setTimeout(() => {
      // Aquí iría la petición al servicio para cargar datos reales
      this.loading = false;
    }, 1200);
  }

  // Método para filtrar usuarios
  filtrarUsuarios() {
    if (!this.filtroTexto) {
      return this.usuarios;
    }

    const filtro = this.filtroTexto.toLowerCase();

    return this.usuarios.filter(usuario => {
      switch (this.filtroPor) {
        case 'nombre':
          return usuario.nombre.toLowerCase().includes(filtro);
        case 'email':
          return usuario.email.toLowerCase().includes(filtro);
        case 'rol':
          return usuario.rol.toLowerCase().includes(filtro);
        default:
          return true;
      }
    });
  }

  // Método para formatear fecha
  formatFecha(fecha: Date): string {
    return fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Método para editar un usuario
  editarUsuario(id: number): void {
    // Aquí iría la lógica para navegar a la página de edición
    console.log('Editar usuario', id);
  }

  // Método para desactivar un usuario
  desactivarUsuario(id: number): void {
    if (confirm('¿Estás seguro de que quieres desactivar este usuario?')) {
      // Aquí iría la lógica para desactivar al usuario
      console.log('Desactivar usuario', id);
    }
  }

  // Método para ver las estadísticas de un usuario
  verEstadisticas(id: number): void {
    // Aquí iría la lógica para navegar a las estadísticas del usuario
    console.log('Ver estadísticas del usuario', id);
  }

  // Método para exportar la lista de usuarios
  exportarUsuarios(): void {
    // Aquí iría la lógica para exportar la lista a CSV/Excel
    console.log('Exportando lista de usuarios...');
  }

  // Método para gestionar las columnas visibles
  toggleColumna(nombreColumna: string): void {
    const columna = this.columnas.find(col => col.nombre === nombreColumna);
    if (columna) {
      columna.visible = !columna.visible;
    }
  }
}
