import { Component, OnInit } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-estadisticas-region',
  templateUrl: './estadisticas-region.component.html',
  styleUrls: ['./estadisticas-region.component.css']
})
export class EstadisticasRegionComponent implements OnInit {
  // Estados de la interfaz
  loading = false;
  error = '';
  regionSeleccionada = 'Sierra de Guadarrama';

  // Datos simulados de regiones disponibles
  regiones = [
    'Sierra de Guadarrama',
    'Picos de Europa',
    'Sierra Nevada',
    'Pirineos',
    'Montes de Toledo',
    'Sistema Ibérico',
    'Costa Mediterránea',
    'Costa Atlántica'
  ];

  // Datos de la región seleccionada (simulados)
  datosRegion = {
    nombre: 'Sierra de Guadarrama',
    totalRutas: 2845,
    totalPuntos: 12678,
    totalKilometros: 45720,
    altitudMedia: 1842,
    desnivelMedio: 680,
    dificultadMedia: 'Media',
    masVisitadaPor: 'Madrid',
    tiempoMedio: '4h 30m',
    valoracionMedia: 4.7,
    rutaMasPopular: 'Peñalara desde Cotos',
    usuariosActivos: 7520
  };

  // Distribución por tipos de ruta en la región
  distribucionTipos = [
    { tipo: 'Senderismo', porcentaje: 42, rutas: 1195 },
    { tipo: 'Ciclismo', porcentaje: 26, rutas: 740 },
    { tipo: 'Running', porcentaje: 16, rutas: 455 },
    { tipo: 'Alpinismo', porcentaje: 12, rutas: 341 },
    { tipo: 'Otros', porcentaje: 4, rutas: 114 }
  ];

  // Estadísticas por mes
  estadisticasMensuales = [
    { mes: 'Noviembre', rutas: 180, usuarios: 1250 },
    { mes: 'Diciembre', rutas: 165, usuarios: 1180 },
    { mes: 'Enero', rutas: 145, usuarios: 1050 },
    { mes: 'Febrero', rutas: 160, usuarios: 1150 },
    { mes: 'Marzo', rutas: 210, usuarios: 1350 },
    { mes: 'Abril', rutas: 270, usuarios: 1650 }
  ];

  // Rutas destacadas
  rutasDestacadas = [
    {
      nombre: 'Peñalara desde Cotos',
      distancia: 12.5,
      desnivel: 850,
      tiempo: '5h 15m',
      dificultad: 'Media-Alta',
      valoracion: 4.8,
      usuarios: 1842
    },
    {
      nombre: 'La Pedriza Circular',
      distancia: 16.2,
      desnivel: 720,
      tiempo: '6h 30m',
      dificultad: 'Media',
      valoracion: 4.7,
      usuarios: 1654
    },
    {
      nombre: 'Siete Picos',
      distancia: 14.8,
      desnivel: 680,
      tiempo: '5h 45m',
      dificultad: 'Media',
      valoracion: 4.6,
      usuarios: 1520
    },
    {
      nombre: 'Valle de la Fuenfría',
      distancia: 10.2,
      desnivel: 450,
      tiempo: '3h 30m',
      dificultad: 'Baja',
      valoracion: 4.5,
      usuarios: 2150
    }
  ];

  // Puntos de interés destacados
  puntosDestacados = [
    {
      nombre: 'Laguna Grande de Peñalara',
      tipo: 'Laguna',
      altitud: 2017,
      valoracion: 4.9,
      visitas: 2840
    },
    {
      nombre: 'Mirador de los Robledos',
      tipo: 'Mirador',
      altitud: 1750,
      valoracion: 4.7,
      visitas: 2420
    },
    {
      nombre: 'Cascada del Purgatorio',
      tipo: 'Cascada',
      altitud: 1250,
      valoracion: 4.6,
      visitas: 1950
    }
  ];


  ngOnInit(): void {
    this.cargarDatosRegion();
  }

  cargarDatosRegion(): void {
    this.loading = true;

    // Simulación de carga de datos
    setTimeout(() => {
      // Aquí iría la petición al servicio para cargar datos reales
      this.loading = false;
    }, 1200);
  }

  cambiarRegion(region: string): void {
    if (region !== this.regionSeleccionada) {
      this.regionSeleccionada = region;
      this.loading = true;

      // Simulación de carga de datos de la nueva región
      setTimeout(() => {
        // Simulamos actualización de datos
        this.datosRegion.nombre = region;

        // En un caso real, aquí se cargarían los datos específicos de la región
        this.loading = false;
      }, 1000);
    }
  }

  // Método para obtener color según dificultad
  getColorDificultad(dificultad: string): string {
    switch(dificultad) {
      case 'Baja': return 'difficulty-low';
      case 'Media': return 'difficulty-medium';
      case 'Media-Alta': return 'difficulty-medium-high';
      case 'Alta': return 'difficulty-high';
      default: return 'difficulty-medium';
    }
  }

  // Método para formatear valoración con estrellas
  getValoracionEstrellas(valoracion: number): string {
    const estrellas = Math.floor(valoracion);
    let resultado = '';

    for (let i = 0; i < estrellas; i++) {
      resultado += '★';
    }

    // Añadir media estrella si corresponde
    if (valoracion - estrellas >= 0.5) {
      resultado += '½';
    }

    return resultado;
  }
}
