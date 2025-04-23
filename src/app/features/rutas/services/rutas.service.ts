import { Injectable } from '@angular/core';
import { Ruta } from '../../../models/ruta.model';
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  deleteDoc,
  doc,
  Timestamp,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../../app.module';
import { getAuth } from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class RutasService {
  private rutasRef = collection(db, 'rutas');

  constructor() {}

  private getUserId(): string | null {
    const auth = getAuth();
    const user = auth.currentUser;
    return user ? user.uid : null;
  }

  async crearRuta(rutaParcial: Omit<Ruta, 'fechaCreacion' | 'usuarioCreador'>): Promise<void> {
    const ruta: Ruta = {
      ...rutaParcial,
      fechaCreacion: Timestamp.now(),
      usuarioCreador: this.getUserId() ?? 'desconocido'
    };

    await addDoc(this.rutasRef, ruta);
  }

  async cargarRutasPorUsuario(usuarioId: string): Promise<Ruta[]> {
    const q = query(this.rutasRef, where('usuarioCreador', '==', usuarioId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      nombre: doc.data()['nombre'],
      tipoRuta: doc.data()['tipoRuta'],
      puntos: doc.data()['puntos'],
      fechaCreacion: doc.data()['fechaCreacion'],
      usuarioCreador: doc.data()['usuarioCreador']
    }) as Ruta);
  }

  async obtenerRutaPorId(id: string): Promise<Ruta | null> {
    const rutaDoc = doc(this.rutasRef, id);
    const snapshot = await getDoc(rutaDoc);

    if (snapshot.exists()) {
      const data = snapshot.data();
      return {
        id: snapshot.id,
        nombre: data['nombre'],
        tipoRuta: data['tipoRuta'],
        puntos: data['puntos'],
        fechaCreacion: data['fechaCreacion'],
        usuarioCreador: data['usuarioCreador']
      } as Ruta;
    }

    return null;
  }

  async eliminarRutaPorId(id: string): Promise<void> {
    const rutaDoc = doc(this.rutasRef, id);
    await deleteDoc(rutaDoc);
  }
}
