export interface MensajeContacto {
  id?: string;
  nombre: string;
  email: string;
  asunto: string;
  categoria: string;
  mensaje: string;
  privacidad: boolean;
  newsletter: boolean;
  fechaEnvio?: Date;
  estado?: EstadoMensaje;
  respuesta?: string;
  fechaRespuesta?: Date;
}

export enum EstadoMensaje {
  PENDIENTE = 'pendiente',
  EN_PROCESO = 'en_proceso',
  RESPONDIDO = 'respondido',
  ARCHIVADO = 'archivado'
}

export interface AgenteSoporte {
  id: string;
  nombre: string;
  avatar: string;
  cargo: string;
  disponible: boolean;
}
