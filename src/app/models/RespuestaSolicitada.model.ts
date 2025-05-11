import { EstadoSolicitud } from "./guia.model";

export interface RespuestaSolicitudGuia {
  success: boolean;
  mensaje: string;
  solicitud: {
    id: string;
    tema: string;
    fechaSolicitud: Date;
    estado: EstadoSolicitud;
  };
}

export interface RespuestaOperacionSimple {
  success: boolean;
}
