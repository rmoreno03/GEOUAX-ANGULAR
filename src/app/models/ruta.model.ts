import { Timestamp } from 'firebase/firestore';
import { PuntoLocalizacion } from '../models/punto-localizacion.model';

export interface Ruta {
  id?: string;
  nombre: string;
  puntos: PuntoLocalizacion[];
  fechaCreacion: Timestamp;
  usuarioCreador: string;
  tipoRuta: 'driving' | 'walking' | 'cycling';
  distanciaKm?: number;
  duracionMin?: number;
}
