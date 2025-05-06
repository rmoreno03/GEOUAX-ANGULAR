export interface PreguntaFrecuente {
  id: string;
  pregunta: string;
  respuesta: string;
  categoria: string;
  fechaCreacion: Date;
  fechaActualizacion?: Date;
  visitas?: number;
  valoraciones?: {
    utiles: number;
    noUtiles: number;
  };
  etiquetas?: string[];
  links?: Link[];
  expanded?: boolean; // Propiedad para UI, no se almacena en backend
  util?: boolean | null; // Propiedad para UI, no se almacena en backend
}

export interface Link {
  texto: string;
  url: string;
  interno: boolean; // true = link interno de la app, false = link externo
}
