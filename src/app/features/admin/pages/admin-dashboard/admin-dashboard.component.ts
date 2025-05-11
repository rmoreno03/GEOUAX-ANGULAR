import { Component, inject, OnInit } from '@angular/core';
import { Firestore, collection, collectionData, query, where, orderBy } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Usuario } from '../../../../models/usuario.model';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  standalone: false
})
export class AdminDashboardComponent implements OnInit {
  firestore: Firestore = inject(Firestore);
  usuarios$: Observable<Usuario[]>;
  usuariosFiltrados: Usuario[] = [];
  todosUsuarios: Usuario[] = [];
  cargando = true;

  // Stats
  totalUsuarios = 0;
  usuariosAdmin = 0;
  usuariosActivos = 0;
  totalRutas = 0;

  // Filtros y búsqueda
  searchTerm = '';
  filtroRol = '';
  filtroActivo = '';
  filtroProveedor = '';
  ordenUsuarios = 'reciente';

  // Paginación
  itemsPorPagina = 8;
  paginaActual = 1;
  totalPaginas = 1;

  constructor() {
    const usuariosRef = collection(this.firestore, 'usuarios');
    const usuariosQuery = query(usuariosRef, orderBy('fechaRegistro', 'desc'));
    this.usuarios$ = collectionData(usuariosQuery, { idField: 'uid' }) as Observable<Usuario[]>;
  }

  ngOnInit(): void {
    this.usuarios$.subscribe(usuarios => {
      this.todosUsuarios = usuarios;
      this.calcularEstadisticas(usuarios);
      this.filtrarUsuarios();
      this.cargando = false;
    });
  }

  calcularEstadisticas(usuarios: Usuario[]): void {
    this.totalUsuarios = usuarios.length;
    this.usuariosAdmin = usuarios.filter(u => u.rol === 'admin').length;
    this.usuariosActivos = usuarios.filter(u => u.estaActivo === true).length;

    // Calcular total de rutas
    this.totalRutas = usuarios.reduce((total, usuario) => {
      return total + (usuario.totalRutas || 0);
    }, 0);
  }

  filtrarUsuarios(): void {
    let usuariosFiltrados = [...this.todosUsuarios];

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
      usuariosFiltrados = usuariosFiltrados.filter(u => u.authProvider === this.filtroProveedor);
    }

    // Buscar por término
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      usuariosFiltrados = usuariosFiltrados.filter(u =>
        (u.nombre && u.nombre.toLowerCase().includes(term)) ||
        (u.email && u.email.toLowerCase().includes(term)) ||
        (u.uid && u.uid.toLowerCase().includes(term)) ||
        (u.biografia && u.biografia.toLowerCase().includes(term)) ||
        (u.phoneNumber && u.phoneNumber.includes(term)) ||
        (u.nombreLowercase && u.nombreLowercase.includes(term))
      );
    }

    // Ordenar según selección
    this.ordenarLista(usuariosFiltrados);

    // Actualizar paginación
    this.totalPaginas = Math.ceil(usuariosFiltrados.length / this.itemsPorPagina);
    if (this.paginaActual > this.totalPaginas) {
      this.paginaActual = 1;
    }

    // Aplicar paginación
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    this.usuariosFiltrados = usuariosFiltrados.slice(inicio, fin);
  }

  ordenarUsuarios(): void {
    this.ordenarLista(this.usuariosFiltrados);
  }

  ordenarLista(lista: Usuario[]): void {
    switch (this.ordenUsuarios) {
      case 'reciente':
        lista.sort((a, b) => this.compararFechas(b.fechaRegistro, a.fechaRegistro));
        break;
      case 'ultimaConexion':
        lista.sort((a, b) => this.compararFechas(b.ultimaConexion || b.fechaUltimoLogin, a.ultimaConexion || a.fechaUltimoLogin));
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
      const date1 = fecha1?.toDate ? fecha1.toDate() : fecha1 || new Date(0);
      const date2 = fecha2?.toDate ? fecha2.toDate() : fecha2 || new Date(0);
      return date1.getTime() - date2.getTime();
    } catch (error) {
      return 0;
    }
  }

  cambiarPagina(pagina: number): void {
    this.paginaActual = pagina;
    this.filtrarUsuarios();
  }

  resetFiltros(): void {
    this.searchTerm = '';
    this.filtroRol = '';
    this.filtroActivo = '';
    this.filtroProveedor = '';
    this.ordenUsuarios = 'reciente';
    this.paginaActual = 1;
    this.filtrarUsuarios();
  }

  formatFecha(fecha: any): string {
    if (!fecha) return '';
    try {
      const date = fecha.toDate ? fecha.toDate() : fecha;
      return date.toLocaleDateString('es-ES', {
        day: '2-digit', month: 'long', year: 'numeric'
      });
    } catch (error) {
      return '';
    }
  }

  getInitials(nombre: string): string {
    if (!nombre) return '?';
    return nombre.split(' ').map(n => n[0]).join('').substr(0, 2).toUpperCase();
  }

  getProviderIcon(provider: string): string {
    switch (provider) {
      case 'google': return 'fa-google';
      case 'facebook': return 'fa-facebook-f';
      case 'twitter': return 'fa-twitter';
      case 'email': return 'fa-envelope';
      default: return 'fa-user';
    }
  }
}
