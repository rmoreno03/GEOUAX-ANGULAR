import { Component, OnInit } from '@angular/core';

interface Logro {
  id: number;
  nombre: string;
  descripcion: string;
  icono: string;
  categoria: string;
  nivel: 'bronce' | 'plata' | 'oro';
  completado: boolean;
  fechaObtencion: Date | null;
  progreso: number;
}


@Component({
  standalone: false,
  selector: 'app-ver-logros',
  templateUrl: './ver-logros.component.html',
  styleUrls: ['./ver-logros.component.css']
})
export class VerLogrosComponent implements OnInit {
  // Estados de la interfaz
  loading = false;
  error = '';
  filtroActivo = 'todos';

  // Datos simulados de logros
  logros = [
    {
      id: 1,
      nombre: 'Explorador Novato',
      descripcion: 'Completa tu primera ruta',
      icono: 'map',
      categoria: 'distancia',
      nivel: 'bronce' as const,
      completado: true,
      fechaObtencion: new Date('2024-12-15'),
      progreso: 100
    },
    {
      id: 2,
      nombre: 'Madrugador',
      descripcion: 'Completa 5 rutas antes de las 8:00 AM',
      icono: 'sun',
      categoria: 'tiempo',
      nivel: 'plata' as const,
      completado: true,
      fechaObtencion: new Date('2025-01-05'),
      progreso: 100
    },
    {
      id: 3,
      nombre: 'Trotamundos',
      descripcion: 'Recorre un total de 100 kilómetros',
      icono: 'road',
      categoria: 'distancia',
      nivel: 'oro' as const,
      completado: false,
      fechaObtencion: null,
      progreso: 78
    },
    {
      id: 4,
      nombre: 'Fotógrafo Natural',
      descripcion: 'Registra 20 puntos de interés con fotos',
      icono: 'camera',
      categoria: 'puntos',
      nivel: 'bronce' as const,
      completado: true,
      fechaObtencion: new Date('2025-02-10'),
      progreso: 100
    },
    {
      id: 5,
      nombre: 'Conquistador de Cumbres',
      descripcion: 'Alcanza 10 puntos con altitud superior a 1500m',
      icono: 'mountain',
      categoria: 'puntos',
      nivel: 'plata' as const,
      completado: false,
      fechaObtencion: null,
      progreso: 60
    },
    {
      id: 6,
      nombre: 'Ecologista',
      descripcion: 'Completa 15 rutas utilizando transporte público',
      icono: 'leaf',
      categoria: 'ecologia',
      nivel: 'oro' as const,
      completado: false,
      fechaObtencion: null,
      progreso: 40
    }
  ];

  // Categorías disponibles para filtrar
  categorias = [
    { id: 'todos', nombre: 'Todos', icono: 'list' },
    { id: 'distancia', nombre: 'Distancia', icono: 'road' },
    { id: 'tiempo', nombre: 'Tiempo', icono: 'clock' },
    { id: 'puntos', nombre: 'Puntos', icono: 'map-marker-alt' },
    { id: 'ecologia', nombre: 'Ecología', icono: 'leaf' }
  ];

  // Datos de progreso general
  progresoGeneral = {
    totalLogros: 6,
    logrosCompletados: 3,
    porcentajeCompletado: 50,
    siguienteLogro: 'Conquistador de Cumbres',
    proximoACompletar: 'Trotamundos',
    porcentajeProximo: 78
  };


  ngOnInit(): void {
    this.cargarLogros();
  }

  cargarLogros(): void {
    this.loading = true;

    // Simulación de carga de datos
    setTimeout(() => {
      // Aquí iría la petición al servicio para cargar datos reales
      this.loading = false;
    }, 1000);
  }

  filtrarPorCategoria(categoria: string): void {
    this.filtroActivo = categoria;
  }

  // Método para obtener logros filtrados
  obtenerLogrosFiltrados(): Logro[] {
    if (this.filtroActivo === 'todos') {
      return this.logros;
    } else {
      return this.logros.filter(logro => logro.categoria === this.filtroActivo);
    }
  }

  // Método para obtener clase CSS según nivel
  getClaseNivel(nivel: string): string {
    switch(nivel) {
      case 'bronce': return 'nivel-bronce';
      case 'plata': return 'nivel-plata';
      case 'oro': return 'nivel-oro';
      default: return '';
    }
  }

  // Método para formatear fecha
  formatearFecha(fecha: Date | null): string {
    if (!fecha) return 'No completado';
    return fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
