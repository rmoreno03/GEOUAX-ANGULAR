import { Component, OnInit } from '@angular/core';
import { Firestore, collection, collectionData, query, orderBy, deleteDoc, doc, updateDoc, where, getDocs } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { Usuario } from '../../../../models/usuario.model';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  standalone: false
})
export class AdminDashboardComponent implements OnInit {
  usuarios$ = new BehaviorSubject<Usuario[]>([]);
  rutas$ = new BehaviorSubject<any[]>([]);

  // Datos procesados
  usuariosFiltrados: Usuario[] = [];

  // Stats
  totalUsuarios = 0;
  usuariosAdmin = 0;
  usuariosActivos = 0;
  totalRutas = 0;

  // Tendencias (comparado con mes anterior)
  tendencias = {
    totalUsuarios: 12,
    usuariosAdmin: 0,
    usuariosActivos: 5,
    totalRutas: 23
  };

  // Filtros y búsqueda
  searchTerm = '';
  filtroRol = '';
  filtroActivo = '';
  filtroProveedor = '';
  ordenUsuarios = 'reciente';

  // Paginación
  itemsPorPagina = 10;
  paginaActual = 1;
  totalPaginas = 1;

  // Estados
  cargando = true;
  usuariosSeleccionados = new Set<string>();
  mostrarModalEliminar = false;
  mostrarModalEditar = false;
  usuarioEditando: Usuario | null = null;
  todosUsuarios: Usuario[] = [];

  constructor(
    private firestore: Firestore,
    public router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    await this.cargarDatos();
    this.aplicarFiltros();
  }

  async cargarDatos(): Promise<void> {
    try {
      // Cargar usuarios
      const usuariosRef = collection(this.firestore, 'usuarios');
      const usuariosQuery = query(usuariosRef, orderBy('fechaRegistro', 'desc'));

      collectionData(usuariosQuery, { idField: 'uid' }).subscribe(async (usuarios: any[]) => {
        // Cargar estadísticas de rutas para cada usuario
        for (const usuario of usuarios) {
          usuario.totalRutas = await this.contarRutasUsuario(usuario.uid);
          usuario.rutasPublicas = await this.contarRutasPublicasUsuario(usuario.uid);
          usuario.kmRecorridos = await this.calcularKmRecorridos(usuario.uid);
        }

        this.todosUsuarios = usuarios as Usuario[];
        this.usuarios$.next(this.todosUsuarios);
        this.calcularEstadisticas();
        this.aplicarFiltros();
        this.cargando = false;
      });

      // Cargar todas las rutas para estadísticas globales
      const rutasRef = collection(this.firestore, 'rutas');
      collectionData(rutasRef).subscribe((rutas: any[]) => {
        this.rutas$.next(rutas);
        this.calcularEstadisticas();
      });

    } catch (error) {
      console.error('Error al cargar datos:', error);
      this.cargando = false;
    }
  }

  async contarRutasUsuario(usuarioId: string): Promise<number> {
    try {
      const rutasRef = collection(this.firestore, 'rutas');
      const q = query(rutasRef, where('usuarioCreador', '==', usuarioId));
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error al contar rutas:', error);
      return 0;
    }
  }

  async contarRutasPublicasUsuario(usuarioId: string): Promise<number> {
    try {
      const rutasRef = collection(this.firestore, 'rutas');
      const q = query(
        rutasRef,
        where('usuarioCreador', '==', usuarioId),
        where('isPublic', '==', true)
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error al contar rutas públicas:', error);
      return 0;
    }
  }

  async calcularKmRecorridos(usuarioId: string): Promise<number> {
    try {
      const rutasRef = collection(this.firestore, 'rutas');
      const q = query(rutasRef, where('usuarioCreador', '==', usuarioId));
      const snapshot = await getDocs(q);

      let totalKm = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        totalKm += data['distanciaKm'] || 0;
      });

      return Math.round(totalKm);
    } catch (error) {
      console.error('Error al calcular km recorridos:', error);
      return 0;
    }
  }

  calcularEstadisticas(): void {
    const usuarios = this.usuarios$.value;
    const rutas = this.rutas$.value;

    this.totalUsuarios = usuarios.length;
    this.usuariosAdmin = usuarios.filter(u => u.rol === 'admin').length;
    this.usuariosActivos = usuarios.filter(u => u.estaActivo === true).length;
    this.totalRutas = rutas.length;

    // Calcular tendencias (simular comparación con mes anterior)
    this.calcularTendencias();
  }

  calcularTendencias(): void {
    // Aquí podrías implementar lógica real para comparar con datos del mes anterior
    // Por ahora uso valores simulados basados en los datos actuales

    const variacionBase = this.totalUsuarios > 0 ? this.totalUsuarios * 0.12 : 0;

    this.tendencias = {
      totalUsuarios: Math.round(variacionBase) || 12,
      usuariosAdmin: 0,
      usuariosActivos: Math.round(this.usuariosActivos * 0.05) || 5,
      totalRutas: Math.round(this.totalRutas * 0.23) || 23
    };
  }

  aplicarFiltros(): void {
    if (this.cargando) return;

    let usuariosFiltrados = [...this.usuarios$.value];

    // Filtrar por búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      usuariosFiltrados = usuariosFiltrados.filter(u =>
        (u.nombre && u.nombre.toLowerCase().includes(term)) ||
        (u.email && u.email.toLowerCase().includes(term)) ||
        (u.uid && u.uid.toLowerCase().includes(term)) ||
        (u.biografia && u.biografia.toLowerCase().includes(term)) ||
        (u.phoneNumber && u.phoneNumber.includes(term))
      );
    }

    // Filtrar por rol
    if (this.filtroRol) {
      usuariosFiltrados = usuariosFiltrados.filter(u => u.rol === this.filtroRol);
    }

    // Filtrar por estado activo/inactivo
    if (this.filtroActivo) {
      const estaActivo = this.filtroActivo === 'true';
      usuariosFiltrados = usuariosFiltrados.filter(u => u.estaActivo === estaActivo);
    }

    // Filtrar por proveedor de autenticación
    if (this.filtroProveedor) {
      usuariosFiltrados = usuariosFiltrados.filter(u => {
        if (this.filtroProveedor === 'email') {
          return !u.authProvider || u.authProvider === 'email';
        }
        return u.authProvider === this.filtroProveedor;
      });
    }

    // Ordenar según selección
    this.ordenarLista(usuariosFiltrados);

    // Actualizar paginación
    this.totalPaginas = Math.ceil(usuariosFiltrados.length / this.itemsPorPagina);
    if (this.paginaActual > this.totalPaginas && this.totalPaginas > 0) {
      this.paginaActual = 1;
    }

    // Aplicar paginación
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    this.usuariosFiltrados = usuariosFiltrados.slice(inicio, fin);
  }

  ordenarLista(lista: Usuario[]): void {
    switch (this.ordenUsuarios) {
      case 'reciente':
        lista.sort((a, b) => this.compararFechas(b.fechaRegistro, a.fechaRegistro));
        break;
      case 'ultimaConexion':
        lista.sort((a, b) => this.compararFechas(
          b.ultimaConexion || b.fechaUltimoLogin,
          a.ultimaConexion || a.fechaUltimoLogin
        ));
        break;
      case 'alfabetico':
        lista.sort((a, b) => {
          const nombreA = (a.nombre || '').toLowerCase();
          const nombreB = (b.nombre || '').toLowerCase();
          return nombreA.localeCompare(nombreB);
        });
        break;
      case 'totalRutas':
        lista.sort((a, b) => (b.totalRutas || 0) - (a.totalRutas || 0));
        break;
    }
  }

  compararFechas(fecha1: any, fecha2: any): number {
    try {
      const date1 = fecha1?.toDate ? fecha1.toDate() : fecha1 ? new Date(fecha1) : new Date(0);
      const date2 = fecha2?.toDate ? fecha2.toDate() : fecha2 ? new Date(fecha2) : new Date(0);
      return date1.getTime() - date2.getTime();
    } catch (error) {
      console.error('Error al comparar fechas:', error);
      return 0;
    }
  }

  filtrarUsuarios(): void {
    this.paginaActual = 1;
    this.aplicarFiltros();
  }

  resetFiltros(): void {
    this.searchTerm = '';
    this.filtroRol = '';
    this.filtroActivo = '';
    this.filtroProveedor = '';
    this.ordenUsuarios = 'reciente';
    this.paginaActual = 1;
    this.aplicarFiltros();
  }

  cambiarPagina(pagina: number): void {
    this.paginaActual = pagina;
    this.aplicarFiltros();
  }

  formatFecha(fecha: any): string {
    if (!fecha) return '';
    try {
      const date = fecha?.toDate ? fecha.toDate() : fecha ? new Date(fecha) : null;
      if (!date || isNaN(date.getTime())) return '';

      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return '';
    }
  }

  getInitials(nombre: string): string {
    if (!nombre) return '?';
    return nombre.split(' ').map(n => n[0]).join('').substr(0, 2).toUpperCase();
  }

  getProviderIcon(provider: string): string {
    if (!provider) return 'fa-envelope';

    switch (provider) {
      case 'google': return 'fa-google';
      case 'facebook': return 'fa-facebook-f';
      case 'twitter': return 'fa-twitter';
      case 'email':
      default: return 'fa-envelope';
    }
  }

  // Métodos de acciones
  async editarUsuario(usuario: Usuario): Promise<void> {
    this.usuarioEditando = { ...usuario };
    this.mostrarModalEditar = true;
  }

  async guardarUsuario(): Promise<void> {
    if (!this.usuarioEditando) return;

    try {
      const userRef = doc(this.firestore, `usuarios/${this.usuarioEditando.uid}`);
      await updateDoc(userRef, {
        rol: this.usuarioEditando.rol,
        estaActivo: this.usuarioEditando.estaActivo,
        nombre: this.usuarioEditando.nombre,
        biografia: this.usuarioEditando.biografia || ''
      });

      this.mostrarModalEditar = false;
      this.usuarioEditando = null;
      await this.cargarDatos();
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      alert('Error al actualizar el usuario. Por favor, intenta de nuevo.');
    }
  }

  async eliminarUsuario(uid: string): Promise<void> {
    try {
      const userRef = doc(this.firestore, `usuarios/${uid}`);
      await deleteDoc(userRef);
      await this.cargarDatos();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      alert('Error al eliminar el usuario. Por favor, intenta de nuevo.');
    }
  }

  async toggleUsuarioActivo(usuario: Usuario): Promise<void> {
    try {
      const userRef = doc(this.firestore, `usuarios/${usuario.uid}`);
      await updateDoc(userRef, {
        estaActivo: !usuario.estaActivo
      });
      await this.cargarDatos();
    } catch (error) {
      console.error('Error al cambiar estado del usuario:', error);
      alert('Error al cambiar el estado del usuario. Por favor, intenta de nuevo.');
    }
  }

  toggleSeleccionUsuario(uid: string): void {
    if (this.usuariosSeleccionados.has(uid)) {
      this.usuariosSeleccionados.delete(uid);
    } else {
      this.usuariosSeleccionados.add(uid);
    }
  }

  toggleSeleccionTodo(): void {
    if (this.usuariosSeleccionados.size === this.usuariosFiltrados.length) {
      this.usuariosSeleccionados.clear();
    } else {
      this.usuariosSeleccionados.clear();
      this.usuariosFiltrados.forEach(user => this.usuariosSeleccionados.add(user.uid));
    }
  }

  async eliminarUsuariosSeleccionados(): Promise<void> {
    if (this.usuariosSeleccionados.size === 0) return;

    if (confirm(`¿Estás seguro de que quieres eliminar ${this.usuariosSeleccionados.size} usuarios?`)) {
      try {
        const promises = Array.from(this.usuariosSeleccionados).map(uid =>
          this.eliminarUsuario(uid)
        );
        await Promise.all(promises);
        this.usuariosSeleccionados.clear();
        await this.cargarDatos();
      } catch (error) {
        console.error('Error al eliminar usuarios seleccionados:', error);
        alert('Error al eliminar algunos usuarios. Por favor, intenta de nuevo.');
      }
    }
  }

  cancelarEdicion(): void {
    this.mostrarModalEditar = false;
    this.usuarioEditando = null;
  }

  confirmarEliminar(uid: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      this.eliminarUsuario(uid);
    }
  }
}
