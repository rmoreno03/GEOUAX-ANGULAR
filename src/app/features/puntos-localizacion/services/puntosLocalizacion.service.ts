import { Injectable } from '@angular/core';
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
import { AuditLogService } from '../../../core/services/audit-log.service';

@Injectable({ providedIn: 'root' })
export class PuntosLocalizacionService {
  private collectionRef;

  constructor(
    private firestore: Firestore,
    private storage: Storage,
    private auth: Auth,
    private auditLog: AuditLogService // NUEVO
  ) {
    this.collectionRef = collection(this.firestore, 'puntos_localizacion');
  }

  async cargarPuntosLocalizacion(): Promise<PuntoLocalizacion[]> {
    try {
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
          fotos: data['fotos'] || [],
          usuarioCreador: data['usuarioCreador'] || ''
        };
      });
    } catch (error) {
      console.error('Error al cargar puntos:', error);
      // NUEVO: Log de error
      await this.auditLog.logError('Error al cargar puntos de localización', error, 'cargarPuntosLocalizacion');
      return [];
    }
  }

  async cargarPuntosLocalizacionPorUsuario(usuarioId: string): Promise<PuntoLocalizacion[]> {
    try {
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
          fotos: data['fotos'] || [],
          usuarioCreador: data['usuarioCreador'] || ''
        };
      });
    } catch (error) {
      console.error('Error al cargar puntos del usuario:', error);
      // NUEVO: Log de error
      await this.auditLog.logError('Error al cargar puntos de usuario', error, 'cargarPuntosLocalizacionPorUsuario');
      return [];
    }
  }

  async obtenerPuntoPorId(id: string): Promise<PuntoLocalizacion | null> {
    try {
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
    } catch (error) {
      console.error('Error al obtener punto:', error);
      // NUEVO: Log de error
      await this.auditLog.logError('Error al obtener punto por ID', error, 'obtenerPuntoPorId');
      return null;
    }
  }

  async crearPunto(punto: PuntoLocalizacion): Promise<void> {
    try {
      const nuevoPunto = {
        ...punto,
        fechaCreacion: Timestamp.now()
      };

      const docRef = await addDoc(this.collectionRef, nuevoPunto);

      // NUEVO: Log de punto creado
      await this.auditLog.logPuntoCreado(docRef.id, punto.nombre);
    } catch (error) {
      console.error('Error al crear punto:', error);
      // NUEVO: Log de error
      await this.auditLog.logError('Error al crear punto', error, 'crearPunto');
      throw error;
    }
  }

  async actualizarPunto(punto: PuntoLocalizacion): Promise<void> {
    try {
      const docRef = doc(this.collectionRef, punto.id);
      await updateDoc(docRef, {
        nombre: punto.nombre,
        descripcion: punto.descripcion,
        latitud: punto.latitud,
        longitud: punto.longitud,
        fechaCreacion: punto.fechaCreacion,
        fotos: punto.fotos
      });

      // NUEVO: Log de punto actualizado (similar a perfil actualizado)
      await this.auditLog.log(
        `Punto de localización actualizado: "${punto.nombre}"`,
        'info',
        { puntoId: punto.id, nombre: punto.nombre },
        punto.id,
        'punto'
      );
    } catch (error) {
      console.error('Error al actualizar punto:', error);
      // NUEVO: Log de error
      await this.auditLog.logError('Error al actualizar punto', error, 'actualizarPunto');
      throw error;
    }
  }

  async eliminarPunto(id: string): Promise<void> {
    try {
      // Primero obtener el nombre para el log
      const docRef = doc(this.collectionRef, id);
      const docSnap = await getDoc(docRef);
      let nombrePunto = 'Punto desconocido';

      if (docSnap.exists()) {
        nombrePunto = docSnap.data()['nombre'] || 'Punto sin nombre';
      }

      await deleteDoc(docRef);

      // NUEVO: Log de punto eliminado
      await this.auditLog.logPuntoEliminado(id, nombrePunto);
    } catch (error) {
      console.error('Error al eliminar punto:', error);
      // NUEVO: Log de error
      await this.auditLog.logError('Error al eliminar punto', error, 'eliminarPunto');
      throw error;
    }
  }

  async subirFoto(file: File): Promise<string> {
    try {
      const nombreArchivo = `puntos/${uuidv4()}-${file.name}`;
      const storageRef = ref(this.storage, nombreArchivo);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);

      // NUEVO: Log de foto subida
      await this.auditLog.log(
        'Foto subida a punto de localización',
        'info',
        { nombreArchivo, url },
        undefined,
        'punto'
      );

      return url;
    } catch (error) {
      console.error('Error al subir foto:', error);
      // NUEVO: Log de error
      await this.auditLog.logError('Error al subir foto de punto', error, 'subirFoto');
      throw error;
    }
  }

  public getUserId(): string | null {
    const user = this.auth.currentUser;
    return user ? user.uid : null;
  }
}
