export interface Tutorial {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  nivel: string; // básico, intermedio, avanzado
  duracion: string; // formato: "10 min", "1 hora", etc.
  imagenUrl: string;
  videoUrl?: string;
  fecha: Date;
  visitas?: number;
  pasos: PasoTutorial[];
  consejos?: string[];
}

export interface PasoTutorial {
  titulo: string;
  descripcion: string;
  imagen?: string;
}
