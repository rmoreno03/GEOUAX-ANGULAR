import { Component, inject, OnInit } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  updateDoc,
} from '@angular/fire/firestore';
import { Usuario } from '../../../../models/usuario.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-gestion-usuarios',
  templateUrl: './gestion-usuarios.component.html',
  styleUrls: ['./gestion-usuarios.component.css'],
  standalone: false
})
export class GestionUsuariosComponent implements OnInit {
  firestore: Firestore = inject(Firestore);
  usuarios$: Observable<Usuario[]>;
  todos: Usuario[] = [];
  filtrados: Usuario[] = [];

  searchTerm = '';
  cargando = true;

  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  constructor() {
    const usuariosRef = collection(this.firestore, 'usuarios');
    this.usuarios$ = collectionData(usuariosRef, { idField: 'uid' }) as Observable<Usuario[]>;
  }

  ngOnInit(): void {
    this.usuarios$.subscribe(users => {
      this.todos = users;
      this.cargando = false;
      this.filtrar();
    });
  }

  filtrar(): void {
    const termino = this.searchTerm.toLowerCase();
    this.filtrados = this.todos.filter(user =>
      user.nombre?.toLowerCase().includes(termino) ||
      user.email?.toLowerCase().includes(termino) ||
      user.rol?.toLowerCase().includes(termino)
    );
    this.totalPages = Math.max(1, Math.ceil(this.filtrados.length / this.itemsPerPage));
    this.currentPage = 1;
  }

  get paginados(): Usuario[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filtrados.slice(start, start + this.itemsPerPage);
  }

  cambiarPagina(p: number): void {
    if (p >= 1 && p <= this.totalPages) this.currentPage = p;
  }

  formatFecha(fecha: any): string {
    if (!fecha) return '';
    const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
    return date.toLocaleDateString('es-ES');
  }

  async cambiarRol(user: Usuario, nuevoRol: 'admin' | 'usuario' | 'moderador') {
    const ref = doc(this.firestore, 'usuarios', user.uid);
    await updateDoc(ref, { rol: nuevoRol });
    user.rol = nuevoRol;
  }

  async toggleEstado(user: Usuario) {
    const ref = doc(this.firestore, 'usuarios', user.uid);
    const nuevoEstado = !user.estaActivo;
    await updateDoc(ref, { estaActivo: nuevoEstado });
    user.estaActivo = nuevoEstado;
  }

  getValorEvento(event: Event): 'admin' | 'usuario' | 'moderador' {
    return (event.target as HTMLSelectElement).value as 'admin' | 'usuario' | 'moderador';
  }

}
