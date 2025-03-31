import { Injectable } from '@angular/core';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../app.module';
import { PuntoLocalizacion } from '../../../models/punto-localizacion.model';

@Injectable({
  providedIn: 'root'
})
export class PuntosLocalizacionService {

  constructor() { }

  async cargarPuntosLocalizacion(): Promise<PuntoLocalizacion[]> {
    const puntosCollection = collection(db, 'puntos_localizacion');
    const puntosSnapshot = await getDocs(puntosCollection);

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
}
