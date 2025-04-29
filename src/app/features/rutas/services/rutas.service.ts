import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  deleteDoc,
  doc,
  Timestamp,
  query,
  where
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import mbxDirections from '@mapbox/mapbox-sdk/services/directions';
import { environment } from '../../../../environments/environment';
import { Ruta } from '../../../models/ruta.model';

// Define el tipo aceptable para tipoRuta
export type TipoRuta = 'driving' | 'walking' | 'cycling';

@Injectable({
  providedIn: 'root'
})
export class RutasService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private rutasRef = collection(this.firestore, 'rutas');

  directionsClient = mbxDirections({ accessToken: environment.mapbox_key });

  public getUserId(): string | null {
    return this.auth.currentUser?.uid ?? null;
  }

  /**
   * Valida que el tipo de ruta sea uno de los valores permitidos
   */
  private validarTipoRuta(tipo: unknown): TipoRuta {
    // Asegúrate de que el valor sea uno de los permitidos
    if (tipo === 'driving' || tipo === 'walking' || tipo === 'cycling') {
      return tipo as TipoRuta;
    }

    // Si el tipo es un objeto con una propiedad value (PrimeNG dropdown)
    if (tipo && typeof tipo === 'object' && 'value' in tipo) {
      const value = tipo.value;
      if (value === 'driving' || value === 'walking' || value === 'cycling') {
        return value as TipoRuta;
      }
    }

    // Valor por defecto
    return 'driving';
  }

  /**
   * Crea una nueva ruta
   */
  async crearRuta(rutaParcial: Omit<Ruta, 'fechaCreacion' | 'usuarioCreador' | 'distanciaKm' | 'duracionMin'>): Promise<void> {
    // Validar el tipo de ruta para asegurar que es uno de los valores permitidos
    const tipoRuta = this.validarTipoRuta(rutaParcial.tipoRuta);

    const waypoints = rutaParcial.puntos.map(p => ({
      coordinates: [p.longitud, p.latitud]
    }));

    try {
      const res = await this.directionsClient.getDirections({
        profile: tipoRuta, // Usamos el tipo validado
        waypoints,
        geometries: 'geojson'
      }).send();

      // Verificar que haya rutas disponibles
      if (!res.body.routes || res.body.routes.length === 0) {
        throw new Error('No se pudo calcular una ruta entre los puntos seleccionados');
      }

      const data = res.body.routes[0];
      const distanciaKm = +(data.distance / 1000).toFixed(2); // metros → km
      const duracionMin = +(data.duration / 60).toFixed(1);   // segundos → min

      const ruta: Ruta = {
        ...rutaParcial,
        tipoRuta: tipoRuta, // Asignamos el tipo validado
        fechaCreacion: Timestamp.now(),
        usuarioCreador: this.getUserId() ?? 'desconocido',
        distanciaKm,
        duracionMin
      };

      await addDoc(this.rutasRef, ruta);
    } catch (error) {
      console.error('Error al crear ruta:', error);
      throw error;
    }
  }

  /**
   * Carga las rutas de un usuario específico
   */
  async cargarRutasPorUsuario(usuarioId: string): Promise<Ruta[]> {
    try {
      const q = query(this.rutasRef, where('usuarioCreador', '==', usuarioId));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          nombre: data['nombre'],
          tipoRuta: data['tipoRuta'],
          puntos: data['puntos'],
          fechaCreacion: data['fechaCreacion'],
          usuarioCreador: data['usuarioCreador'],
          distanciaKm: data['distanciaKm'] || 0,
          duracionMin: data['duracionMin'] || 0
        } as Ruta;
      });
    } catch (error) {
      console.error('Error al cargar rutas:', error);
      return [];
    }
  }

  /**
   * Obtiene una ruta por su ID
   */
  async obtenerRutaPorId(id: string): Promise<Ruta | null> {
    try {
      const docRef = doc(this.firestore, `rutas/${id}`);
      const snap = await getDoc(docRef);

      if (!snap.exists()) return null;

      const data = snap.data();

      // Asegurar estructura y casting correcto
      const ruta: Ruta = {
        id: snap.id,
        nombre: data['nombre'],
        tipoRuta: data['tipoRuta'],
        distanciaKm: data['distanciaKm'],
        duracionMin: data['duracionMin'],
        fechaCreacion: data['fechaCreacion'],
        usuarioCreador: data['usuarioCreador'],
        puntos: (data['puntos'] || []).map((p: any) => ({
          id: p.id,
          nombre: p.nombre,
          descripcion: p.descripcion,
          latitud: p.latitud,
          longitud: p.longitud,
          fotos: p.fotos || []
        }))
      };

      return ruta;
    } catch (error) {
      console.error('Error obteniendo ruta por ID:', error);
      return null;
    }
  }

  /**
   * Elimina una ruta por su ID
   */
  async eliminarRutaPorId(id: string): Promise<void> {
    try {
      const rutaDoc = doc(this.rutasRef, id);
      await deleteDoc(rutaDoc);
    } catch (error) {
      console.error('Error al eliminar ruta:', error);
      throw error;
    }
  }
}
