import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  query,
  where,
  getDocs
} from '@angular/fire/firestore';
import { Usuario } from '../../../../models/usuario.model';
import { Observable, Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-gestion-usuarios',
  templateUrl: './gestion-usuarios.component.html',
  styleUrls: ['./gestion-usuarios.component.css'],
  standalone: false
})
export class GestionUsuariosComponent implements OnInit, OnDestroy {
  usuarios$: Observable<Usuario[]>;
  todos: Usuario[] = [];
  filtrados: Usuario[] = [];

  // Filtros
  searchTerm = '';
  filtroRol = '';
  filtroEstado = '';

  // Paginación
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  // Estados
  cargando = true;
  usuario$: Subscription | null = null;

  // Usuario actual (para permisos)
  currentUser: Usuario | null = null;

  constructor(
    private firestore: Firestore,
    private router: Router
  ) {
    const usuariosRef = collection(this.firestore, 'usuarios');
    const q = query(usuariosRef, orderBy('fechaRegistro', 'desc'));
    this.usuarios$ = collectionData(q, { idField: 'uid' }) as Observable<Usuario[]>;
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  private cargarDatos(): void {
    this.usuario$ = this.usuarios$.subscribe(async (users) => {
      try {
        // Cargar estadísticas de rutas para cada usuario
        for (const usuario of users) {
          usuario.totalRutas = await this.contarRutasUsuario(usuario.uid);
          usuario.rutasPublicas = await this.contarRutasPublicasUsuario(usuario.uid);
          usuario.kmRecorridos = await this.calcularKmRecorridos(usuario.uid);
        }

        this.todos = users;
        this.cargando = false;
        this.aplicarFiltros();
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
        this.cargando = false;
      }
    });
  }

  // Métodos para calcular estadísticas de rutas
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

  filtrar(): void {
    this.aplicarFiltros();
  }

  private aplicarFiltros(): void {
    let filtrados = [...this.todos];

    // Filtro de búsqueda
    if (this.searchTerm) {
      const termino = this.searchTerm.toLowerCase();
      filtrados = filtrados.filter(user =>
        user.nombre?.toLowerCase().includes(termino) ||
        user.email?.toLowerCase().includes(termino) ||
        user.rol?.toLowerCase().includes(termino) ||
        user.uid?.toLowerCase().includes(termino)
      );
    }

    // Filtro de rol
    if (this.filtroRol) {
      filtrados = filtrados.filter(user => user.rol === this.filtroRol);
    }

    // Filtro de estado
    if (this.filtroEstado !== '') {
      const estaActivo = this.filtroEstado === 'true';
      filtrados = filtrados.filter(user => user.estaActivo === estaActivo);
    }

    this.filtrados = filtrados;
    this.totalPages = Math.max(1, Math.ceil(this.filtrados.length / this.itemsPerPage));

    // Ajustar página actual si es necesario
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  get paginados(): Usuario[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filtrados.slice(start, start + this.itemsPerPage);
  }

  cambiarPagina(p: number): void {
    if (p >= 1 && p <= this.totalPages) {
      this.currentPage = p;
    }
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.aplicarFiltros();
  }

  formatFecha(fecha: any): string {
    if (!fecha) return '';
    try {
      const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  }

  async cambiarRol(user: Usuario, nuevoRol: 'admin' | 'usuario' | 'moderador'): Promise<void> {
    if (!this.canEditUser(user)) {
      alert('No tienes permisos para cambiar el rol de este usuario');
      return;
    }

    try {
      const ref = doc(this.firestore, 'usuarios', user.uid);
      await updateDoc(ref, { rol: nuevoRol });

      // Actualizar el usuario en la lista local
      const index = this.todos.findIndex(u => u.uid === user.uid);
      if (index !== -1) {
        this.todos[index].rol = nuevoRol;
        this.aplicarFiltros();
      }
    } catch (error) {
      console.error('Error al cambiar rol:', error);
      alert('Error al cambiar el rol del usuario');
    }
  }

  async toggleEstado(user: Usuario): Promise<void> {
    if (!this.canEditUser(user)) {
      alert('No tienes permisos para cambiar el estado de este usuario');
      return;
    }

    try {
      const ref = doc(this.firestore, 'usuarios', user.uid);
      const nuevoEstado = !user.estaActivo;
      await updateDoc(ref, { estaActivo: nuevoEstado });

      // Actualizar el usuario en la lista local
      const index = this.todos.findIndex(u => u.uid === user.uid);
      if (index !== -1) {
        this.todos[index].estaActivo = nuevoEstado;
        this.aplicarFiltros();
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert('Error al cambiar el estado del usuario');
    }
  }

  async deleteUser(user: Usuario): Promise<void> {
    if (!this.canDeleteUser(user)) {
      alert('No tienes permisos para eliminar este usuario');
      return;
    }

    if (confirm(`¿Estás seguro de que quieres eliminar al usuario ${user.nombre || user.email}?`)) {
      try {
        const ref = doc(this.firestore, 'usuarios', user.uid);
        await deleteDoc(ref);

        // Remover de la lista local
        this.todos = this.todos.filter(u => u.uid !== user.uid);
        this.aplicarFiltros();
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
        alert('Error al eliminar el usuario');
      }
    }
  }

  viewUser(user: Usuario): void {
    this.router.navigate(['/admin/usuarios', user.uid]);
  }

  editUser(user: Usuario): void {
    this.router.navigate(['/admin/usuarios', user.uid, 'edit']);
  }

  getValorEvento(event: Event): 'admin' | 'usuario' | 'moderador' {
    return (event.target as HTMLSelectElement).value as 'admin' | 'usuario' | 'moderador';
  }

  onImageError(event: any): void {
    event.target.src = 'default-avatar.png';
  }

  // Métodos de permisos
  canEditUser(user: Usuario): boolean {
    // Implementar lógica de permisos según tu necesidad
    // Por ejemplo: solo admin puede editar otros admins
    return true; // Por ahora, permitir todo
  }

  canDeleteUser(user: Usuario): boolean {
    // Implementar lógica de permisos
    // Por ejemplo: no permitir que el último admin se elimine a sí mismo
    return true; // Por ahora, permitir todo
  }

  // Métodos para estadísticas rápidas
  getAdminCount(): number {
    return this.filtrados.filter(user => user.rol === 'admin').length;
  }

  getActiveCount(): number {
    return this.filtrados.filter(user => user.estaActivo).length;
  }

  // Métodos para la interfaz
  clearSearch(): void {
    this.searchTerm = '';
    this.aplicarFiltros();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filtroRol = '';
    this.filtroEstado = '';
    this.aplicarFiltros();
  }

  refreshData(): void {
    this.cargando = true;
    this.cargarDatos();
  }

  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (this.currentPage > 3) {
        pages.push('...');
      }

      const startPage = Math.max(2, this.currentPage - 1);
      const endPage = Math.min(this.totalPages - 1, this.currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (this.currentPage < this.totalPages - 2) {
        pages.push('...');
      }

      pages.push(this.totalPages);
    }

    return pages;
  }

  ngOnDestroy(): void {
    if (this.usuario$) {
      this.usuario$.unsubscribe();
    }
  }
}
