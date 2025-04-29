import { inject, Injectable } from '@angular/core';
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
import mbxDirections from '@mapbox/mapbox-sdk/services/directions';
import { environment } from '../../../../environments/environment';
import { Ruta } from '../../../models/ruta.model';
import { TipoRuta } from '../../../models/ruta.model';
import { PuntoLocalizacion } from '../../../models/punto-localizacion.model';



@Injectable({ providedIn: 'root' })
export class RutasService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private rutasRef = collection(this.firestore, 'rutas');

  directionsClient = mbxDirections({ accessToken: environment.mapbox_key });

  public getUserId(): string | null {
    return this.auth.currentUser?.uid ?? null;
  }

  private validarTipoRuta(tipo: unknown): TipoRuta {
    if (tipo === 'driving' || tipo === 'walking' || tipo === 'cycling') {
      return tipo as TipoRuta;
    }
    if (tipo && typeof tipo === 'object' && 'value' in tipo) {
      if (typeof (tipo as { value?: string })?.value === 'string') {
        const value = (tipo as { value: string }).value;
        if (value === 'driving' || value === 'walking' || value === 'cycling') {
          return value as TipoRuta;
        }
      }
    }
    return 'driving';
  }

  private generarStaticMapUrl(coordenadas: [number, number][]): string {
    const path = coordenadas.map(([lon, lat]) => `${lon},${lat}`).join(',');
    const overlay = `path-5+f7941d-0.5(${path})`;

    const lons = coordenadas.map(c => c[0]);
    const lats = coordenadas.map(c => c[1]);
    const lonCenter = lons.reduce((a, b) => a + b) / lons.length;
    const latCenter = lats.reduce((a, b) => a + b) / lats.length;

    return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${encodeURIComponent(overlay)}/${lonCenter},${latCenter},13/600x300@2x?access_token=${environment.mapbox_key}`;
  }

  async crearRuta(
    rutaParcial: Omit<Ruta, 'fechaCreacion' | 'usuarioCreador' | 'distanciaKm' | 'duracionMin' | 'imagenUrl'>
  ): Promise<void> {
    const tipoRuta = this.validarTipoRuta(rutaParcial.tipoRuta);

    const waypoints = rutaParcial.puntos.map(p => ({
      coordinates: [p.longitud, p.latitud]
    }));

    try {
      // Obtener la ruta desde Mapbox Directions API
      const res = await this.directionsClient.getDirections({
        profile: tipoRuta,
        waypoints,
        geometries: 'geojson'
      }).send();

      if (!res.body.routes || res.body.routes.length === 0) {
        throw new Error('No se pudo calcular una ruta entre los puntos seleccionados');
      }

      const data = res.body.routes[0];
      const distanciaKm = +(data.distance / 1000).toFixed(2);
      const duracionMin = +(data.duration / 60).toFixed(1);

      // Generar imagen estática del mapa SIN la línea de ruta
      const coordenadas = waypoints.map(w => w.coordinates);
      const lons = coordenadas.map(c => c[0]);
      const lats = coordenadas.map(c => c[1]);
      const lonCenter = lons.reduce((a, b) => a + b) / lons.length;
      const latCenter = lats.reduce((a, b) => a + b) / lats.length;

      const imagenUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${lonCenter},${latCenter},13/600x300@2x?access_token=${environment.mapbox_key}`;

      // Crear la ruta completa con todos los datos
      const ruta: Ruta = {
        ...rutaParcial,
        tipoRuta,
        fechaCreacion: Timestamp.now(),
        usuarioCreador: this.getUserId() ?? 'desconocido',
        distanciaKm,
        duracionMin,
        imagenUrl
      };

      // Guardar la ruta en Firestore
      await addDoc(this.rutasRef, ruta);

      console.log('Ruta creada con éxito:', ruta.nombre);
    } catch (error) {
      console.error('Error al crear ruta:', error);
      throw error;
    }
  }


  async cargarRutasPorUsuario(usuarioId: string): Promise<Ruta[]> {
    try {
      const q = query(this.rutasRef, where('usuarioCreador', '==', usuarioId));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => this.mapearRuta(doc.id, doc.data() as Omit<Ruta, 'id'>));
    } catch (error) {
      console.error('Error al cargar rutas:', error);
      return [];
    }
  }

  async cargarRutasPublicas(): Promise<Ruta[]> {
    try {
      const q = query(this.rutasRef, where('isPublic', '==', true));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => this.mapearRuta(doc.id, doc.data() as Omit<Ruta, 'id'>));
    } catch (error) {
      console.error('Error al cargar rutas públicas:', error);
      throw error;
    }
  }

  async obtenerRutaPorId(id: string): Promise<Ruta | null> {
    try {
      const docRef = doc(this.firestore, `rutas/${id}`);
      const snap = await getDoc(docRef);

      if (!snap.exists()) return null;

      return this.mapearRuta(snap.id, snap.data() as Omit<Ruta, 'id'>);
    } catch (error) {
      console.error('Error obteniendo ruta por ID:', error);
      return null;
    }
  }

  private mapearRuta(id: string, data: Omit<Ruta, 'id'>): Ruta {
    return {
      id,
      nombre: data.nombre,
      descripcion: data.descripcion || '',
      puntos: (data.puntos || []).map((p: Partial<PuntoLocalizacion>) => ({
        id: p.id ?? '',
        nombre: p.nombre ?? '',
        descripcion: p.descripcion ?? '',
        latitud: p.latitud ?? 0,
        longitud: p.longitud ?? 0,
        fotos: p.fotos || [],
        fechaCreacion: p.fechaCreacion || Timestamp.now(),
        usuarioCreador: p.usuarioCreador || 'desconocido'
      })),
      tipoRuta: data.tipoRuta,
      distanciaKm: data.distanciaKm || 0,
      duracionMin: data.duracionMin || 0,
      fechaCreacion: data.fechaCreacion,
      usuarioCreador: data.usuarioCreador,
      valoracionPromedio: data.valoracionPromedio || 0,
      visitas: data.visitas || 0,
      imagenUrl: data.imagenUrl || '',
      ubicacionInicio: data.ubicacionInicio || '',
      tiempoEstimado: data.tiempoEstimado || '',
      isPublic: data.isPublic || false
    };
  }

  async eliminarRutaPorId(id: string): Promise<void> {
    try {
      const rutaDoc = doc(this.rutasRef, id);
      await deleteDoc(rutaDoc);
    } catch (error) {
      console.error('Error al eliminar ruta:', error);
      throw error;
    }
  }

  async incrementarVisitas(id: string): Promise<void> {
    try {
      const rutaDoc = doc(this.firestore, `rutas/${id}`);
      const rutaSnap = await getDoc(rutaDoc);

      if (!rutaSnap.exists()) return;

      const visitasActuales = rutaSnap.data()['visitas'] || 0;
      await updateDoc(rutaDoc, { visitas: visitasActuales + 1 });
    } catch (error) {
      console.error('Error al incrementar visitas:', error);
    }
  }

  async actualizarValoracion(id: string, nuevaValoracion: number): Promise<void> {
    try {
      const rutaDoc = doc(this.firestore, `rutas/${id}`);
      const rutaSnap = await getDoc(rutaDoc);

      if (!rutaSnap.exists()) return;

      const valoracionActual = rutaSnap.data()['valoracionPromedio'] || 0;
      const visitasActuales = rutaSnap.data()['visitas'] || 1; // evitar dividir por cero

      const nuevaMedia = ((valoracionActual * (visitasActuales - 1)) + nuevaValoracion) / visitasActuales;

      await updateDoc(rutaDoc, { valoracionPromedio: nuevaMedia });
    } catch (error) {
      console.error('Error al actualizar valoracion:', error);
    }
  }
}
