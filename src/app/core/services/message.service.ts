import { Injectable } from '@angular/core';

export type TipoMensaje = 'exito' | 'eliminado' | 'warning';

@Injectable({ providedIn: 'root' })
export class MessageService {
  mensaje: string = '';
  tipo: TipoMensaje = 'exito';

  setMensaje(texto: string, tipo: TipoMensaje = 'exito') {
    this.mensaje = texto;
    this.tipo = tipo;
  }

  getMensaje(): { texto: string, tipo: TipoMensaje } {
    const mensaje = { texto: this.mensaje, tipo: this.tipo };
    this.limpiar();
    return mensaje;
  }

  limpiar() {
    this.mensaje = '';
    this.tipo = 'exito';
  }
}
