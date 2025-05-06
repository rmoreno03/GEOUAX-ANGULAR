import { Timestamp } from "firebase/firestore";

export interface Usuario {
  // Propiedades básicas
  uid: string;
  email: string;
  nombre: string;

  // Datos opcionales de perfil
  fotoUrl?: string;
  biografia?: string;
  fechaRegistro: Date | Timestamp; // Firestore maneja fechas como objeto

  // Control y permisos
  rol: 'admin' | 'usuario' | 'moderador';
  estaActivo?: boolean;
  ultimaConexion?: Date | Timestamp;

  // Relaciones sociales
  amigos?: string[]; // Array de UIDs de amigos

  // Estadísticas
  totalRutas?: number;
  rutasPublicas?: number;
  kmRecorridos?: number;

  // Configuración y preferencias
  ajustes?: {
    privacidad?: {
      perfilPublico?: boolean;
      mostrarEmail?: boolean;
      mostrarAmigos?: boolean;
      notificacionesEmail?: boolean;
    },
    mapa?: {
      tipoMapa?: 'satelite' | 'carretera' | 'terreno' | 'hibrido';
      unidades?: 'km' | 'millas';
      zoom?: number;
    }
  };

  // Firebase Auth Provider (for social logins)
  authProvider?: 'google' | 'facebook' | 'twitter' | 'email';

  // Búsqueda rápida - para queries eficientes
  nombreLowercase?: string; // Nombre en minúsculas para búsquedas insensibles a mayúsculas
}
