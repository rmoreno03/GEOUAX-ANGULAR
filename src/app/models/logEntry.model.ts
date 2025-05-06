import { Timestamp } from 'firebase/firestore';

export interface LogEntry {
  id: string;
  usuario: string;
  accion: string;
  fecha: Timestamp;
  tipo: 'info' | 'warn' | 'error';
  ip?: string;
}
