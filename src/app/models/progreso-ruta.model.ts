import { Timestamp } from '@angular/fire/firestore';

export interface ProgresoRuta {
  id?: string;
  rutaId: string;
  usuarioId: string;
  completado: boolean;
  puntosCompletados: Record<string, boolean>;
  fechaInicio: Timestamp | null;
  fechaUltimaActividad: Timestamp | null;
  fechaFin: Timestamp | null;
  tiempoTotal?: number;
  distanciaReal?: number;
}
