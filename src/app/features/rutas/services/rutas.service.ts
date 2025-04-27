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

@Injectable({
  providedIn: 'root'
})
export class RutasService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private rutasRef = collection(this.firestore, 'rutas');

  directionsClient = mbxDirections({ accessToken: environment.mapbox_key });



  private getUserId(): string | null {
    return this.auth.currentUser?.uid ?? null;
  }

  async crearRuta(rutaParcial: Omit<Ruta, 'fechaCreacion' | 'usuarioCreador' | 'distanciaKm' | 'duracionMin'>): Promise<void> {
    const waypoints = rutaParcial.puntos.map(p => ({
      coordinates: [p.longitud, p.latitud]
    }));

    const res = await this.directionsClient.getDirections({
      profile: rutaParcial.tipoRuta,
      waypoints,
      geometries: 'geojson'
    }).send();

    const data = res.body.routes[0];
    const distanciaKm = +(data.distance / 1000).toFixed(2); // metros → km
    const duracionMin = +(data.duration / 60).toFixed(1);   // segundos → min

    const ruta: Ruta = {
      ...rutaParcial,
      fechaCreacion: Timestamp.now(),
      usuarioCreador: this.getUserId() ?? 'desconocido',
      distanciaKm,
      duracionMin
    };

    await addDoc(this.rutasRef, ruta);
  }

  async cargarRutasPorUsuario(usuarioId: string): Promise<Ruta[]> {
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
        distanciaKm: data['distanciaKm'],
        duracionMin: data['duracionMin']
      } as Ruta;
    });
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
        usuarioCreador: data['usuarioCreador'],
        distanciaKm: data['distanciaKm'],
        duracionMin: data['duracionMin']
      } as Ruta;
    }

    return null;
  }

  async eliminarRutaPorId(id: string): Promise<void> {
    const rutaDoc = doc(this.rutasRef, id);
    await deleteDoc(rutaDoc);
  }
}
