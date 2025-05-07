import { Timestamp } from "firebase/firestore";

export interface Reporte {
  id: string;
  tipo: string;
  nombre?: string;
  email?: string;
  asunto?: string;
  categoria?: string;
  mensaje?: string;
  fechaEnvio?: Timestamp;
  contenidoId?: string;
  usuarioReportante?: string;
  usuarioReportado?: string;
  motivo?: string;
  prioridad?: string;
  detalles?: string;
  contenido?: string;
  fechaContenido?: Timestamp;
  resuelto?: boolean;
}
