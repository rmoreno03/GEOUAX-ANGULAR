import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  query,
  where,
  QueryConstraint,
  Timestamp
} from '@angular/fire/firestore';
import {
  Storage,
  ref,
  uploadBytes,
  getDownloadURL
} from '@angular/fire/storage';
import { Auth } from '@angular/fire/auth';
import { PuntoLocalizacion } from '../../../models/punto-localizacion.model';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ providedIn: 'root' })
export class PuntosLocalizacionService {
  private firestore = inject(Firestore);
  private storage = inject(Storage);
  private auth = inject(Auth);

  private collectionRef = collection(this.firestore, 'puntos_localizacion');

  constructor() {}

  async cargarPuntosLocalizacion(): Promise<PuntoLocalizacion[]> {
    const puntosSnapshot = await getDocs(this.collectionRef);
    return puntosSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        nombre: (data['nombre'] || '').replace(/^"|"$/g, ''),
        descripcion: (data['descripcion'] || '').replace(/^"|"$/g, ''),
        latitud: data['latitud'] || 0,
        longitud: data['longitud'] || 0,
        fechaCreacion: data['fechaCreacion'] || '',
        foto: data['foto'] || '',
        usuarioCreador: data['usuarioCreador'] || ''
      };
    });
  }

  async cargarPuntosLocalizacionPorUsuario(usuarioId: string): Promise<PuntoLocalizacion[]> {
    const q = query(this.collectionRef, where('usuarioCreador', '==', usuarioId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        nombre: (data['nombre'] || '').replace(/^"|"$/g, ''),
        descripcion: (data['descripcion'] || '').replace(/^"|"$/g, ''),
        latitud: data['latitud'] || 0,
        longitud: data['longitud'] || 0,
        fechaCreacion: data['fechaCreacion'] || '',
        foto: data['foto'] || '',
        usuarioCreador: data['usuarioCreador'] || ''
      };
    });
  }

  async cargarPuntosConFiltros(filtros: Partial<PuntoLocalizacion>): Promise<PuntoLocalizacion[]> {
    const constraints: QueryConstraint[] = [];
    if (filtros.nombre) constraints.push(where('nombre', '==', filtros.nombre));
    if (filtros.descripcion) constraints.push(where('descripcion', '==', filtros.descripcion));
    if (filtros.fechaCreacion) constraints.push(where('fechaCreacion', '==', filtros.fechaCreacion));
    if (filtros.usuarioCreador) constraints.push(where('usuarioCreador', '==', filtros.usuarioCreador));

    const q = query(this.collectionRef, ...constraints);
    const puntosSnapshot = await getDocs(q);
    return puntosSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        nombre: data['nombre'],
        descripcion: data['descripcion'],
        latitud: data['latitud'],
        longitud: data['longitud'],
        fechaCreacion: data['fechaCreacion'] || '',
        foto: data['foto'],
        usuarioCreador: data['usuarioCreador']
      };
    });
  }

  async obtenerPuntoPorId(id: string): Promise<PuntoLocalizacion | null> {
    const docRef = doc(this.collectionRef, id);
    const puntoSnap = await getDoc(docRef);
    if (!puntoSnap.exists()) return null;
    const data = puntoSnap.data();
    return {
      id: puntoSnap.id,
      nombre: data['nombre'],
      descripcion: data['descripcion'],
      latitud: data['latitud'],
      longitud: data['longitud'],
      fechaCreacion: data['fechaCreacion'] || '',
      fotos: data['fotos'] || [],
      usuarioCreador: data['usuarioCreador']
    };
  }

  async crearPunto(punto: PuntoLocalizacion): Promise<void> {
    punto.fechaCreacion = Timestamp.now();
    await addDoc(this.collectionRef, punto);
  }

  async actualizarPunto(punto: PuntoLocalizacion): Promise<void> {
    const docRef = doc(this.collectionRef, punto.id);
    await updateDoc(docRef, {
      nombre: punto.nombre,
      descripcion: punto.descripcion,
      latitud: punto.latitud,
      longitud: punto.longitud,
      fechaCreacion: punto.fechaCreacion,
      fotos: punto.fotos
    });
  }

  async eliminarPunto(id: string): Promise<void> {
    const docRef = doc(this.collectionRef, id);
    await deleteDoc(docRef);
  }

  async subirFoto(file: File): Promise<string> {
    const nombreArchivo = `puntos/${uuidv4()}-${file.name}`;
    const storageRef = ref(this.storage, nombreArchivo);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  }

  public getUserId(): string | null {
    const user = this.auth.currentUser;
    return user ? user.uid : null;
  }
}
