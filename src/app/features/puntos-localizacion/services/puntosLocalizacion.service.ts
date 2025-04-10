import { Injectable } from '@angular/core';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, query, QueryConstraint, where, Timestamp} from 'firebase/firestore';
import { db } from '../../../app.module';
import { PuntoLocalizacion } from '../../../models/punto-localizacion.model';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { getAuth } from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class PuntosLocalizacionService {

  private collectionRef = collection(db, 'puntos_localizacion');



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
    let constraints: QueryConstraint[] = [];

    if (filtros.nombre) {
      constraints.push(where('nombre', '==', filtros.nombre));
    }
    if (filtros.descripcion) {
      constraints.push(where('descripcion', '==', filtros.descripcion));
    }
    if (filtros.fechaCreacion) {
      constraints.push(where('fechaCreacion', '==', filtros.fechaCreacion));
    }
    if (filtros.usuarioCreador) {
      constraints.push(where('usuarioCreador', '==', filtros.usuarioCreador));
    }

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

  async actualizarPunto(id: string, punto: Partial<PuntoLocalizacion>): Promise<void> {
    const docRef = doc(this.collectionRef, id);
    await updateDoc(docRef, punto);
  }

  async eliminarPunto(id: string): Promise<void> {
    const docRef = doc(this.collectionRef, id);
    await deleteDoc(docRef);
  }

  async subirFoto(file: File): Promise<string> {
    const storage = getStorage(); // usa el Firebase Storage inicializado
    const nombreArchivo = `puntos/${uuidv4()}-${file.name}`;
    const storageRef = ref(storage, nombreArchivo);

    // Subir el archivo
    const snapshot = await uploadBytes(storageRef, file);

    // Obtener la URL pública
    const url = await getDownloadURL(snapshot.ref);
    return url;
  }

  public getUserId(): string | null {
    const auth = getAuth();
    const user = auth.currentUser;
    return user ? user.uid : null;
  }
}
