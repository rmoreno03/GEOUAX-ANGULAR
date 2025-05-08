import { Injectable, Inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  query,
  where
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { ProgresoRuta } from '../../../models/progreso-ruta.model';

@Injectable({
  providedIn: 'root'
})
export class ProgresoRutaService {
  private progresoRef;

  constructor(
    private firestore: Firestore,
    private auth: Auth
  ) {
    this.progresoRef = collection(this.firestore, 'progreso-rutas');
  }

  public getUserId(): string | null {
    return this.auth.currentUser?.uid ?? null;
  }

  async crearProgresoRuta(rutaId: string, puntosIds: string[]): Promise<string> {
    try {
      const usuarioId = this.getUserId();
      if (!usuarioId) {
        throw new Error('Usuario no autenticado');
      }

      // Crear un objeto para los puntos completados, todos inicializados como false
      const puntosCompletados: { [id: string]: boolean } = {};
      puntosIds.forEach(id => {
        puntosCompletados[id] = false;
      });

      const nuevoProgreso: ProgresoRuta = {
        rutaId,
        usuarioId,
        completado: false,
        puntosCompletados,
        fechaInicio: Timestamp.now(),
        fechaUltimaActividad: Timestamp.now(),
        fechaFin: null
      };

      const docRef = await addDoc(this.progresoRef, nuevoProgreso);
      return docRef.id;
    } catch (error) {
      console.error('Error al crear progreso de ruta:', error);
      throw error;
    }
  }

  async obtenerProgresoRuta(rutaId: string): Promise<ProgresoRuta | null> {
    try {
      const usuarioId = this.getUserId();
      if (!usuarioId) {
        throw new Error('Usuario no autenticado');
      }

      const q = query(
        this.progresoRef,
        where('rutaId', '==', rutaId),
        where('usuarioId', '==', usuarioId)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as ProgresoRuta;
    } catch (error) {
      console.error('Error al obtener progreso de ruta:', error);
      return null;
    }
  }

  async actualizarProgresoRuta(progresoId: string, actualizaciones: Partial<ProgresoRuta>): Promise<void> {
    try {
      const progresoRef = doc(this.firestore, 'progreso-rutas', progresoId);

      // Siempre actualizar fechaUltimaActividad
      const actualizacionesConTimestamp = {
        ...actualizaciones,
        fechaUltimaActividad: Timestamp.now()
      };

      await updateDoc(progresoRef, actualizacionesConTimestamp);
    } catch (error) {
      console.error('Error al actualizar progreso de ruta:', error);
      throw error;
    }
  }

  async marcarPuntoCompletado(progresoId: string, puntoId: string): Promise<void> {
    try {
      const progresoRef = doc(this.firestore, 'progreso-rutas', progresoId);
      const progresoSnap = await getDoc(progresoRef);

      if (!progresoSnap.exists()) {
        throw new Error('Progreso de ruta no encontrado');
      }

      const progreso = progresoSnap.data() as ProgresoRuta;

      // Actualizar el estado del punto
      const puntosCompletados = { ...progreso.puntosCompletados };
      puntosCompletados[puntoId] = true;

      // Verificar si todos los puntos están completados
      const todosCompletados = Object.values(puntosCompletados).every(estado => estado);

      const actualizaciones: Partial<ProgresoRuta> = {
        puntosCompletados,
        fechaUltimaActividad: Timestamp.now()
      };

      // Si todos los puntos están completados, marcar como completado
      if (todosCompletados) {
        actualizaciones.completado = true;
        actualizaciones.fechaFin = Timestamp.now();

        // Calcular tiempo total en minutos
        if (progreso.fechaInicio) {
          const tiempoTotal = (actualizaciones.fechaFin.toMillis() - progreso.fechaInicio.toMillis()) / (1000 * 60);
          actualizaciones.tiempoTotal = Math.round(tiempoTotal);
        }
      }

      await updateDoc(progresoRef, actualizaciones);
    } catch (error) {
      console.error('Error al marcar punto como completado:', error);
      throw error;
    }
  }

  async obtenerRutasEnProgreso(): Promise<ProgresoRuta[]> {
    try {
      const usuarioId = this.getUserId();
      if (!usuarioId) {
        throw new Error('Usuario no autenticado');
      }

      const q = query(
        this.progresoRef,
        where('usuarioId', '==', usuarioId),
        where('completado', '==', false)
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ProgresoRuta));
    } catch (error) {
      console.error('Error al obtener rutas en progreso:', error);
      return [];
    }
  }

  async obtenerRutasCompletadas(): Promise<ProgresoRuta[]> {
    try {
      const usuarioId = this.getUserId();
      if (!usuarioId) {
        throw new Error('Usuario no autenticado');
      }

      const q = query(
        this.progresoRef,
        where('usuarioId', '==', usuarioId),
        where('completado', '==', true)
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ProgresoRuta));
    } catch (error) {
      console.error('Error al obtener rutas completadas:', error);
      return [];
    }
  }
}
