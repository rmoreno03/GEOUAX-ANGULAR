import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OrdenService {
  private ordenSubject = new BehaviorSubject<{ campo: string, orden: 'asc' | 'desc' } | null>(null);
  orden$ = this.ordenSubject.asObservable();

  setOrden(orden: { campo: string, orden: 'asc' | 'desc' }) {
    this.ordenSubject.next(orden);
  }

  resetOrden() {
    this.ordenSubject.next(null);
  }
}
