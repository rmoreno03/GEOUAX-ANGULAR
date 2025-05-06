export interface Guia {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  fecha: Date;
  paginas: number;
  tamanoMB: number;
  descargas?: number;
  colorFondo?: string; // Color para la previsualización (ej: "#f44336")
  paginasPreview?: string[]; // Array de URLs de imágenes para previsualización
  etiquetas?: string[];
  autor?: string;
  version?: string;
}

export interface SolicitudGuia {
  id?: string;
  tema: string;
  fechaSolicitud?: Date;
  email?: string;
  estado?: EstadoSolicitud;
  respuesta?: string;
  fechaRespuesta?: Date;
  guiaCreada?: string; // ID de la guía si fue creada
}

export enum EstadoSolicitud {
  PENDIENTE = 'pendiente',
  EN_PROCESO = 'en_proceso',
  COMPLETADA = 'completada',
  RECHAZADA = 'rechazada'
}
