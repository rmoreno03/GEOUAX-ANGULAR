import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import {
  Firestore,
  collection,
  getDocs,
  query,
  orderBy,
  where,
  doc,
  updateDoc,
  Timestamp
} from '@angular/fire/firestore';
import { AuditLogService } from '../../../../core/services/audit-log.service';
import { AuthService } from '../../../../auth/services/auth.service';
import { Subscription } from 'rxjs';
import { Usuario } from '../../../../models/usuario.model';

interface UsuarioTabla extends Usuario {
  id: string;
  rutasCreadas?: number;
  puntosRegistrados?: number;
}

@Component({
  standalone: false,
  selector: 'app-lista-usuarios',
  templateUrl: './lista-usuarios.component.html',
  styleUrls: ['./lista-usuarios.component.css']
})
export class ListaUsuariosComponent implements OnInit, OnDestroy {
  // Estados de la interfaz
  loading = false;
  error = '';
  filtroTexto = '';
  filtroPor = 'nombre'; // nombre, email, rol

  // Datos de usuarios
  usuarios: UsuarioTabla[] = [];
  usuariosFiltrados: UsuarioTabla[] = [];

  // Para paginación
  totalUsuarios = 0;
  paginaActual = 1;
  totalPaginas = 1;
  itemsPorPagina = 10;

  // Suscripciones
  private suscripciones: Subscription[] = [];

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

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private router: Router,
    private auditLog: AuditLogService
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  ngOnDestroy(): void {
    // Cancelar todas las suscripciones para evitar memory leaks
    this.suscripciones.forEach(sub => sub.unsubscribe());
  }

  async cargarUsuarios(): Promise<void> {
    try {
      this.loading = true;
      this.error = '';

      // Obtener colección de usuarios
      const usuariosRef = collection(this.firestore, 'usuarios');

      // Crear consulta ordenada por fecha de registro
      const q = query(usuariosRef, orderBy('fechaRegistro', 'desc'));

      // Obtener datos
      const snapshot = await getDocs(q);

      // Procesar usuarios
      this.usuarios = await Promise.all(snapshot.docs.map(async doc => {
        const userData = doc.data() as Usuario;

        // Obtener estadísticas adicionales de cada usuario
        const usuarioConStats = {
          ...userData,
          id: doc.id,
          rutasCreadas: await this.contarRutasUsuario(doc.id),
          puntosRegistrados: await this.contarPuntosUsuario(doc.id)
        };

        return usuarioConStats;
      }));

      this.totalUsuarios = this.usuarios.length;
      this.calcularPaginacion();
      this.aplicarFiltros();

      // Log de carga exitosa
      await this.auditLog.log(
        `Listado de usuarios cargado (${this.usuarios.length} usuarios)`,
        'info',
        { cantidadUsuarios: this.usuarios.length },
        undefined,
        'sistema'
      );

    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      this.error = 'Error al cargar la lista de usuarios. Inténtalo de nuevo.';

      // Log de error
      await this.auditLog.logError('Error al cargar listado de usuarios', error, 'cargarUsuarios');
    } finally {
      this.loading = false;
    }
  }

  // Método para contar rutas creadas por un usuario
  private async contarRutasUsuario(userId: string): Promise<number> {
    try {
      const rutasRef = collection(this.firestore, 'rutas');
      const q = query(rutasRef, where('usuarioCreador', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error al contar rutas del usuario:', error);
      return 0;
    }
  }

  // Método para contar puntos registrados por un usuario
  private async contarPuntosUsuario(userId: string): Promise<number> {
    try {
      const puntosRef = collection(this.firestore, 'puntos_localizacion');
      const q = query(puntosRef, where('usuarioCreador', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error al contar puntos del usuario:', error);
      return 0;
    }
  }

  // Método para filtrar usuarios
  filtrarUsuarios(): UsuarioTabla[] {
    return this.usuariosFiltrados;
  }

  // Aplica filtros y actualiza la lista filtrada
  aplicarFiltros(): void {
    if (!this.filtroTexto) {
      this.usuariosFiltrados = [...this.usuarios];
      return;
    }

    const filtro = this.filtroTexto.toLowerCase();

    this.usuariosFiltrados = this.usuarios.filter(usuario => {
      switch (this.filtroPor) {
        case 'nombre':
          return usuario.nombre?.toLowerCase().includes(filtro);
        case 'email':
          return usuario.email.toLowerCase().includes(filtro);
        case 'rol':
          return usuario.rol?.toLowerCase().includes(filtro);
        default:
          return true;
      }
    });

    this.calcularPaginacion();
  }

  // Método para formatear fecha
  formatFecha(fecha: any): string {
    if (!fecha) return 'N/A';

    try {
      // Convertir Timestamp de Firestore a Date si es necesario
      const date = fecha instanceof Timestamp ? fecha.toDate() : new Date(fecha);

      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Fecha inválida';
    }
  }

  // Método para editar un usuario
  editarUsuario(id: string): void {
    this.auditLog.log(
      'Navegación a edición de usuario',
      'info',
      { userId: id },
      id,
      'usuario'
    );

    this.router.navigate(['/admin/usuarios', id, 'edit']);
  }

  // Método para desactivar un usuario
  async desactivarUsuario(id: string): Promise<void> {
    if (confirm('¿Estás seguro de que quieres desactivar este usuario?')) {
      try {
        const userRef = doc(this.firestore, `usuarios/${id}`);

        // Obtener el usuario para incluir el nombre en el log
        const usuario = this.usuarios.find(u => u.id === id);

        await updateDoc(userRef, {
          estaActivo: false,
          updatedAt: Timestamp.now()
        });

        // Actualizar la lista local
        const index = this.usuarios.findIndex(u => u.id === id);
        if (index !== -1) {
          this.usuarios[index].estaActivo = false;
          this.aplicarFiltros();
        }

        // Log de desactivación
        await this.auditLog.log(
          `Usuario desactivado: ${usuario?.nombre || id}`,
          'warning',
          {
            userId: id,
            email: usuario?.email,
            nombre: usuario?.nombre
          },
          id,
          'usuario'
        );

        console.log('Usuario desactivado correctamente');
      } catch (error) {
        console.error('Error al desactivar usuario:', error);

        // Log de error
        await this.auditLog.logError('Error al desactivar usuario', error, 'desactivarUsuario');
      }
    }
  }

  // Método para ver las estadísticas de un usuario
  verEstadisticas(id: string): void {
    this.auditLog.log(
      'Navegación a estadísticas de usuario',
      'info',
      { userId: id },
      id,
      'usuario'
    );

    this.router.navigate(['/admin/usuarios', id, 'estadisticas']);
  }

  // Método para exportar la lista de usuarios
  async exportarUsuarios(): Promise<void> {
    try {
      // Crear array con los datos a exportar
      const datosExportar = this.usuarios.map(u => {
        return {
          Nombre: u.nombre || 'N/A',
          Email: u.email,
          Rol: u.rol || 'Usuario',
          'Fecha Registro': this.formatFecha(u.fechaRegistro),
          'Último Acceso': this.formatFecha(u.fechaUltimoLogin),
          'Rutas Creadas': u.rutasCreadas,
          'Puntos Registrados': u.puntosRegistrados,
          'Estado': u.estaActivo ? 'Activo' : 'Inactivo'
        };
      });

      // Convertir a CSV
      const cabecera = Object.keys(datosExportar[0]).join(',');
      const filas = datosExportar.map(obj => Object.values(obj).join(','));
      const csv = [cabecera, ...filas].join('\n');

      // Crear blob y enlace de descarga
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `usuarios_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Log de exportación
      await this.auditLog.log(
        `Exportación de lista de usuarios (${datosExportar.length} registros)`,
        'info',
        { cantidadRegistros: datosExportar.length },
        undefined,
        'sistema'
      );

      console.log('Exportación completada');
    } catch (error) {
      console.error('Error al exportar usuarios:', error);

      // Log de error
      await this.auditLog.logError('Error al exportar usuarios', error, 'exportarUsuarios');
    }
  }

  // Métodos de paginación
  calcularPaginacion(): void {
    this.totalPaginas = Math.ceil(this.usuariosFiltrados.length / this.itemsPorPagina);
    if (this.paginaActual > this.totalPaginas) {
      this.paginaActual = 1;
    }
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
    }
  }

  // Verificar si el botón de página anterior está deshabilitado
  get anteriorDeshabilitado(): boolean {
    return this.paginaActual <= 1;
  }

  // Verificar si el botón de página siguiente está deshabilitado
  get siguienteDeshabilitado(): boolean {
    return this.paginaActual >= this.totalPaginas;
  }
}
