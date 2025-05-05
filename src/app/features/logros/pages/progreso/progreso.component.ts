import { Component, OnInit } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-progreso',
  templateUrl: './progreso.component.html',
  styleUrls: ['./progreso.component.css']
})
export class ProgresoComponent implements OnInit {
  // Estados de la interfaz
  loading = false;
  error = '';
  periodoSeleccionado = 'mensual';

  // Datos simulados de progreso general
  progresoGeneral = {
    puntosNivel: 3250,
    puntosNecesarios: 5000,
    nivelActual: 12,
    ranking: 156,
    totalUsuarios: 4782,
    percentil: 97,
    evolucionNivel: [
      { mes: 'Noviembre', puntos: 450 },
      { mes: 'Diciembre', puntos: 720 },
      { mes: 'Enero', puntos: 680 },
      { mes: 'Febrero', puntos: 850 },
      { mes: 'Marzo', puntos: 550 },
      { mes: 'Abril', puntos: 920 }
    ]
  };

  // Datos simulados de actividades recientes
  actividadesRecientes = [
    {
      tipo: 'ruta',
      nombre: 'Ruta del Pico de la Miel',
      fecha: new Date('2025-04-28'),
      puntos: 320,
      kilometros: 14.5,
      logros: ['Madrugador', 'Senderista Activo']
    },
    {
      tipo: 'logro',
      nombre: 'Explorador de Altura',
      fecha: new Date('2025-04-25'),
      puntos: 200,
      descripcion: 'Visitar 5 puntos con altitud superior a 1500m'
    },
    {
      tipo: 'reto',
      nombre: '100km en un mes',
      fecha: new Date('2025-04-20'),
      puntos: 450,
      progreso: 85,
      descripcion: 'Completar 100km en rutas registradas durante un mes'
    },
    {
      tipo: 'ruta',
      nombre: 'Ruta circular La Pedriza',
      fecha: new Date('2025-04-15'),
      puntos: 280,
      kilometros: 12.8,
      logros: ['Fotógrafo Natural']
    },
    {
      tipo: 'nivel',
      nombre: 'Nivel 12 alcanzado',
      fecha: new Date('2025-04-10'),
      puntos: 0,
      descripcion: 'Has subido al nivel 12 - Montañero experimentado'
    }
  ];

  // Datos simulados de estrellas de rendimiento
  estrellas = [
    { categoria: 'Distancia', valor: 4, maximo: 5, porcentaje: 80 },
    { categoria: 'Frecuencia', valor: 3, maximo: 5, porcentaje: 60 },
    { categoria: 'Diversidad', valor: 5, maximo: 5, porcentaje: 100 },
    { categoria: 'Desafío', valor: 4, maximo: 5, porcentaje: 80 },
    { categoria: 'Exploración', valor: 4, maximo: 5, porcentaje: 80 }
  ];

  // Datos simulados para estadísticas detalladas
  estadisticasDetalladas = {
    totalRutas: 57,
    totalKilometros: 678.4,
    totalPuntos: 284,
    nivelPromedio: 'Media',
    altitudMaxima: 2428,
    rutaMasLarga: 24.5,
    tiempoTotal: '126h 45m',
    velocidadMedia: '5.4 km/h',
    desnivelAcumulado: 12450
  };


  ngOnInit(): void {
    this.cargarDatosProgreso();
  }

  cargarDatosProgreso(): void {
    this.loading = true;

    // Simulación de carga de datos
    setTimeout(() => {
      // Aquí iría la petición al servicio para cargar datos reales
      this.loading = false;
    }, 1200);
  }

  cambiarPeriodo(periodo: string): void {
    this.periodoSeleccionado = periodo;
    this.cargarDatosProgreso();
  }

  // Método para calcular porcentaje de nivel
  calcularPorcentajeNivel(): number {
    return (this.progresoGeneral.puntosNivel / this.progresoGeneral.puntosNecesarios) * 100;
  }

  // Método para obtener la posición relativa en el ranking
  calcularPosicionRelativa(): string {
    const porcentaje = (this.progresoGeneral.ranking / this.progresoGeneral.totalUsuarios) * 100;
    if (porcentaje <= 5) return 'elite';
    if (porcentaje <= 20) return 'destacado';
    if (porcentaje <= 50) return 'medio';
    return 'principiante';
  }

  // Método para formatear fecha
  formatearFechaRelativa(fecha: Date): string {
    const ahora = new Date();
    const diferenciaDias = Math.floor((ahora.getTime() - fecha.getTime()) / (1000 * 3600 * 24));

    if (diferenciaDias === 0) return 'Hoy';
    if (diferenciaDias === 1) return 'Ayer';
    if (diferenciaDias < 7) return `Hace ${diferenciaDias} días`;
    if (diferenciaDias < 30) return `Hace ${Math.floor(diferenciaDias / 7)} semanas`;
    return `Hace ${Math.floor(diferenciaDias / 30)} meses`;
  }

  // Método para generar estrellas según valor
  generarEstrellas(valor: number): string[] {
    const estrellas = [];
    // Estrellas completas
    for (let i = 0; i < Math.floor(valor); i++) {
      estrellas.push('full');
    }
    // Media estrella si corresponde
    if (valor % 1 >= 0.5) {
      estrellas.push('half');
    }
    // Estrellas vacías
    const estrellasRestantes = 5 - estrellas.length;
    for (let i = 0; i < estrellasRestantes; i++) {
      estrellas.push('empty');
    }
    return estrellas;
  }

  // Método para obtener clase según tipo de actividad
  getClaseTipoActividad(tipo: string): string {
    switch(tipo) {
      case 'ruta': return 'actividad-ruta';
      case 'logro': return 'actividad-logro';
      case 'reto': return 'actividad-reto';
      case 'nivel': return 'actividad-nivel';
      default: return '';
    }
  }
}
