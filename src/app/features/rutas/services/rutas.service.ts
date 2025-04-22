import { Injectable } from '@angular/core';
import { Ruta } from '../../../models/ruta.model';
import { collection, addDoc, getDocs, deleteDoc, doc, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../../app.module';
import { collectionData } from '@angular/fire/firestore';
import { getAuth } from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class RutasService {
  private rutasRef = collection(db, 'rutas');

  constructor() {}

  async crearRuta(rutaParcial: Omit<Ruta, 'fechaCreacion' | 'usuarioCreador'>): Promise<void> {
    const ruta: Ruta = {
      ...rutaParcial,
      fechaCreacion: Timestamp.now(),
      usuarioCreador: this.getUserId() ?? 'desconocido'
    };

    await addDoc(this.rutasRef, ruta);
  }


  async obtenerRutas(): Promise<Ruta[]> {
    const snapshot = await getDocs(this.rutasRef);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        nombre: data['nombre'],
        puntos: data['puntos'],
        fechaCreacion: data['fechaCreacion'],
        usuarioCreador: data['usuarioCreador'],
        tipoRuta: data['tipoRuta']
      };
    });
  }

  async obtenerRutaPorId(id: string): Promise<Ruta | null> {
    const docRef = doc(this.rutasRef, id);
    const rutaSnap = await getDoc(docRef);
    if (!rutaSnap.exists()) return null;

    const data = rutaSnap.data();
    return {
      id: rutaSnap.id,
      nombre: data['nombre'],
      puntos: data['puntos'],
      fechaCreacion: data['fechaCreacion'],
      usuarioCreador: data['usuarioCreador'],
      tipoRuta: data['tipoRuta']
    };
  }

  async actualizarRuta(ruta: Ruta): Promise<void> {
    const docRef = doc(this.rutasRef, ruta.id);
    await updateDoc(docRef, {
      nombre: ruta.nombre,
      puntos: ruta.puntos,
      fechaCreacion: ruta.fechaCreacion,
      usuarioCreador: ruta.usuarioCreador
    });
  }

  async eliminarRuta(id: string): Promise<void> {
    const docRef = doc(this.rutasRef, id);
    await deleteDoc(docRef);
  }

  private getUserId(): string | null {
    const auth = getAuth();
    const user = auth.currentUser;
    return user ? user.uid : null;
  }
}
