import { Component, inject, OnInit } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Usuario } from '../../../../models/usuario.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  standalone: false
})
export class AdminDashboardComponent implements OnInit {
  firestore: Firestore = inject(Firestore);
  usuarios$: Observable<Usuario[]>;
  cargando = true;

  constructor() {
    const usuariosRef = collection(this.firestore, 'usuarios');
    this.usuarios$ = collectionData(usuariosRef, { idField: 'uid' }) as Observable<Usuario[]>;
  }

  ngOnInit(): void {
    this.usuarios$.subscribe(() => this.cargando = false);
  }

  formatFecha(fecha: any): string {
    if (!fecha) return '';
    const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  }

  getColorRol(rol: string): string {
    switch (rol) {
      case 'admin': return '#d71920';
      case 'moderador': return '#f7941d';
      default: return '#555';
    }
  }
}
