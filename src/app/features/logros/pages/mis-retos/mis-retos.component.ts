import { Component, OnInit } from '@angular/core';
import { Reto } from '../../../../models/reto.model';

@Component({
  standalone: false,
  selector: 'app-mis-retos',
  templateUrl: './mis-retos.component.html',
  styleUrls: ['./mis-retos.component.css']
})
export class MisRetosComponent implements OnInit {
  // Estados de la interfaz
  loading = false;
  error = '';
  filtroActivo = 'activos';

  // Datos simulados de retos
  retos: Reto[] = [
    {
      id: 1,
      nombre: 'Conquistador de cumbres',
      descripcion: 'Visita 5 cumbres de más de 2000m de altitud en 3 meses',
      icono: 'mountain',
      fechaInicio: new Date('2025-01-15'),
      fechaFin: new Date('2025-04-15'),
      progreso: 60,
      estado: 'activo',
      recompensa: 'Medalla de oro + 500 puntos',
      completados: 3,
      total: 5,
      tipo: 'oficial'
    },
    {
      id: 2,
      nombre: '100km en un mes',
      descripcion: 'Recorre 100km en rutas registradas durante un mes',
      icono: 'road',
      fechaInicio: new Date('2025-02-01'),
      fechaFin: new Date('2025-03-01'),
      progreso: 42,
      estado: 'activo',
      recompensa: 'Medalla de plata + 300 puntos',
      completados: 42,
      total: 100,
      tipo: 'oficial'
    },
    {
      id: 3,
      nombre: 'Fotógrafo de montaña',
      descripcion: 'Registra 20 puntos de interés con fotos en rutas de montaña',
      icono: 'camera',
      fechaInicio: new Date('2024-12-10'),
      fechaFin: new Date('2025-03-10'),
      progreso: 85,
      estado: 'activo',
      recompensa: 'Medalla de bronce + 200 puntos',
      completados: 17,
      total: 20,
      tipo: 'oficial'
    },
    {
      id: 4,
      nombre: 'Senderista matutino',
      descripcion: 'Completa 10 rutas que empiecen antes de las 9:00 AM',
      icono: 'sun',
      fechaInicio: new Date('2024-11-15'),
      fechaFin: new Date('2025-01-15'),
      progreso: 100,
      estado: 'completado',
      recompensa: 'Medalla de plata + 300 puntos',
      completados: 10,
      total: 10,
      tipo: 'oficial',
      fechaCompletado: new Date('2025-01-10')
    },
    {
      id: 5,
      nombre: 'Rutas en familia',
      descripcion: 'Completa 5 rutas con al menos 3 miembros de grupo',
      icono: 'users',
      fechaInicio: new Date('2024-12-20'),
      fechaFin: new Date('2025-03-20'),
      progreso: 40,
      estado: 'activo',
      recompensa: 'Insignia personalizada',
      completados: 2,
      total: 5,
      tipo: 'personalizado'
    },
    {
      id: 6,
      nombre: 'Ecoturista',
      descripcion: 'Visita 3 parques naturales protegidos',
      icono: 'leaf',
      fechaInicio: new Date('2024-10-05'),
      fechaFin: new Date('2024-12-05'),
      progreso: 100,
      estado: 'completado',
      recompensa: 'Medalla de oro + 400 puntos',
      completados: 3,
      total: 3,
      tipo: 'oficial',
      fechaCompletado: new Date('2024-11-28')
    }
  ];

  // Opciones de filtro
  filtros = [
    { id: 'activos', nombre: 'Activos' },
    { id: 'completados', nombre: 'Completados' },
    { id: 'todos', nombre: 'Todos' },
    { id: 'oficiales', nombre: 'Oficiales' },
    { id: 'personalizados', nombre: 'Personalizados' }
  ];

  // Estadísticas de retos
  estadisticasRetos = {
    totalRetos: 6,
    retosActivos: 4,
    retosCompletados: 2,
    porcentajeExito: 100,
    retoMasCercano: 'Fotógrafo de montaña',
    porcentajeProximo: 85
  };


  ngOnInit(): void {
    this.cargarRetos();
  }

  cargarRetos(): void {
    this.loading = true;

    // Simulación de carga de datos
    setTimeout(() => {
      // Aquí iría la petición al servicio para cargar datos reales
      this.loading = false;
    }, 1000);
  }

  cambiarFiltro(filtro: string): void {
    this.filtroActivo = filtro;
  }

  // Método para obtener retos filtrados
  obtenerRetosFiltrados(): Reto[] {
    switch(this.filtroActivo) {
      case 'activos':
        return this.retos.filter(reto => reto.estado === 'activo');
      case 'completados':
        return this.retos.filter(reto => reto.estado === 'completado');
      case 'oficiales':
        return this.retos.filter(reto => reto.tipo === 'oficial');
      case 'personalizados':
        return this.retos.filter(reto => reto.tipo === 'personalizado');
      case 'todos':
      default:
        return this.retos;
    }
  }

  // Método para calcular días restantes
  calcularDiasRestantes(fechaFin: Date): number {
    const hoy = new Date();
    const diferencia = fechaFin.getTime() - hoy.getTime();
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  }

  // Método para obtener clase CSS según progreso
  getClaseProgreso(progreso: number): string {
    if (progreso >= 75) return 'progreso-alto';
    if (progreso >= 40) return 'progreso-medio';
    return 'progreso-bajo';
  }

  // Método para formatear fecha
  formatearFecha(fecha: Date): string {
    return fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Método para abandonar un reto (simulado)
  abandonarReto(retoId: number): void {
    if (confirm('¿Estás seguro de que quieres abandonar este reto?')) {
      // Aquí iría la lógica para abandonar el reto
      alert(`Has abandonado el reto ${retoId}`);
    }
  }
}
