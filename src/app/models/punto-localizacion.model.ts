import { Timestamp } from "firebase/firestore";

export interface PuntoLocalizacion {
  id: string;
  nombre: string;
  descripcion: string;
  latitud: number;
  longitud: number;
  fechaCreacion: Timestamp;
  usuarioCreador: string;
  fotos?: string[];
}
