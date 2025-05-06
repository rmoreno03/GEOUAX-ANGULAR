export interface SolicitudAmistad {
  id?: string;
  uidSolicitante: string;
  uidReceptor: string;
  estado: 'pendiente' | 'aceptada' | 'rechazada' | 'cancelada';
  fechaSolicitud: Date;
  fechaRespuesta?: Date;
  notificado?: boolean;
}
