export interface Reto {
  id: number;
  nombre: string;
  descripcion: string;
  icono: string;
  fechaInicio: Date;
  fechaFin: Date;
  progreso: number;
  estado: 'activo' | 'completado';
  recompensa: string;
  completados: number;
  total: number;
  tipo: 'oficial' | 'personalizado';
  fechaCompletado?: Date;
}
