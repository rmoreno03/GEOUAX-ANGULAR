import { Component, OnInit } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-estadisticas',
  templateUrl: './estadisticas.component.html',
  styleUrls: ['./estadisticas.component.css']
})
export class EstadisticasComponent implements OnInit {
  // Datos simulados para estadísticas personales
  datosUsuario = {
    nombre: 'Raúl Moreno Moya',
    nivel: 'Experto',
    puntosXP: 4850,
    siguienteNivel: 5000,
    fechaRegistro: new Date('2023-06-15')
  };

  estadisticasPersonales = {
    rutasCreadas: 28,
    puntosRegistrados: 142,
    kilometrosRecorridos: 756.3,
    mediaKilometros: 27.01,
    tiempoTotal: '46h 28m',
    mediaVelocidad: '16.4 km/h',
    altitudMaxima: 1842,
    desnivel: 12350
  };

  actividadReciente = [
    { tipo: 'ruta', nombre: 'Ruta por la Sierra Norte', fecha: new Date('2025-04-28'), kilometros: 34.5 },
    { tipo: 'punto', nombre: 'Mirador del Valle', fecha: new Date('2025-04-25'), ubicacion: 'Sierra de Guadarrama' },
    { tipo: 'ruta', nombre: 'Circuito Urbano Madrid Río', fecha: new Date('2025-04-20'), kilometros: 12.7 },
    { tipo: 'punto', nombre: 'Cascada del Purgatorio', fecha: new Date('2025-04-15'), ubicacion: 'Rascafría' },
    { tipo: 'ruta', nombre: 'Sendero de los Miradores', fecha: new Date('2025-04-10'), kilometros: 22.3 }
  ];

  comparativasMensuales = [
    { mes: 'Enero', kilometros: 124.5, rutas: 5, puntos: 18 },
    { mes: 'Febrero', kilometros: 98.2, rutas: 4, puntos: 12 },
    { mes: 'Marzo', kilometros: 156.8, rutas: 7, puntos: 26 },
    { mes: 'Abril', kilometros: 187.4, rutas: 8, puntos: 32 }
  ];

  loading = false;
  error = '';


  ngOnInit(): void {
    this.cargarEstadisticasPersonales();
  }

  cargarEstadisticasPersonales(): void {
    this.loading = true;

    // Simulación de carga de datos
    setTimeout(() => {
      // Aquí se cargarían los datos reales desde un servicio
      this.loading = false;
    }, 1200);
  }

  // Método para calcular porcentaje de progreso al siguiente nivel
  calcularProgresoNivel(): number {
    return (this.datosUsuario.puntosXP / this.datosUsuario.siguienteNivel) * 100;
  }

  // Método para obtener la tendencia de actividad reciente
  obtenerTendenciaActividad(): string {
    // Lógica simulada para determinar si la actividad ha aumentado
    return 'aumento';
  }

  // Método para formatear fechas en formato relativo
  formatearFechaRelativa(fecha: Date): string {
    const ahora = new Date();
    const diferenciaDias = Math.floor((ahora.getTime() - fecha.getTime()) / (1000 * 3600 * 24));

    if (diferenciaDias === 0) return 'Hoy';
    if (diferenciaDias === 1) return 'Ayer';
    if (diferenciaDias < 7) return `Hace ${diferenciaDias} días`;
    if (diferenciaDias < 30) return `Hace ${Math.floor(diferenciaDias / 7)} semanas`;
    return `Hace ${Math.floor(diferenciaDias / 30)} meses`;
  }
}
