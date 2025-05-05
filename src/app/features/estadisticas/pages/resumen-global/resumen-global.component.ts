import { Component, OnInit } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-resumen-global',
  templateUrl: './resumen-global.component.html',
  styleUrls: ['./resumen-global.component.css']
})
export class ResumenGlobalComponent implements OnInit {
  // Estados de la interfaz
  loading = false;
  error = '';
  periodoSeleccionado = 'mensual';

  // Datos simulados para estadísticas globales
  estadisticasGlobales = {
    totalUsuarios: 15780,
    usuariosActivos: 8462,
    totalRutas: 42695,
    totalPuntos: 183457,
    kilometrosTotales: 1546982,
    visitasDiarias: 2845,
    paises: 32,
    regiones: 178
  };

  // Datos de actividad mensual
  actividadMensual = [
    { mes: 'Mayo 2024', usuarios: 7500, rutas: 3850, kilometros: 124580 },
    { mes: 'Junio 2024', usuarios: 8120, rutas: 4200, kilometros: 136750 },
    { mes: 'Julio 2024', usuarios: 9800, rutas: 4950, kilometros: 158200 },
    { mes: 'Agosto 2024', usuarios: 11250, rutas: 5600, kilometros: 186400 },
    { mes: 'Septiembre 2024', usuarios: 13400, rutas: 6350, kilometros: 212600 },
    { mes: 'Octubre 2024', usuarios: 15780, rutas: 7120, kilometros: 248450 }
  ];

  // Distribución por tipo de ruta
  distribucionTiposRuta = [
    { tipo: 'Senderismo', porcentaje: 35, rutas: 14943 },
    { tipo: 'Ciclismo', porcentaje: 28, rutas: 11955 },
    { tipo: 'Running', porcentaje: 18, rutas: 7685 },
    { tipo: 'Urbana', porcentaje: 12, rutas: 5123 },
    { tipo: 'Otros', porcentaje: 7, rutas: 2989 }
  ];

  // Top regiones
  topRegiones = [
    { nombre: 'Sierra de Guadarrama', pais: 'España', rutas: 2845, kilometros: 45720 },
    { nombre: 'Picos de Europa', pais: 'España', rutas: 2456, kilometros: 39800 },
    { nombre: 'Sierra Nevada', pais: 'España', rutas: 2120, kilometros: 34560 },
    { nombre: 'Pirineos', pais: 'España/Francia', rutas: 1890, kilometros: 41230 },
    { nombre: 'Alpes', pais: 'Varios', rutas: 1750, kilometros: 48300 }
  ];

  // Dispositivos utilizados
  dispositivos = [
    { tipo: 'Android', porcentaje: 48 },
    { tipo: 'iOS', porcentaje: 43 },
    { tipo: 'Web', porcentaje: 9 }
  ];


  ngOnInit(): void {
    this.cargarDatosResumenGlobal();
  }

  cargarDatosResumenGlobal(): void {
    this.loading = true;

    // Simulación de carga de datos
    setTimeout(() => {
      // Aquí iría la petición al servicio para cargar datos reales
      this.loading = false;
    }, 1200);
  }

  cambiarPeriodo(periodo: string): void {
    this.periodoSeleccionado = periodo;
    this.cargarDatosResumenGlobal();
  }

  // Métodos para calcular estadísticas derivadas
  calcularCrecimientoUsuarios(): number {
    // Cálculo simulado - último mes vs anterior
    const ultimoMes = this.actividadMensual[this.actividadMensual.length - 1];
    const penultimoMes = this.actividadMensual[this.actividadMensual.length - 2];

    return ((ultimoMes.usuarios - penultimoMes.usuarios) / penultimoMes.usuarios) * 100;
  }

  calcularMediaKilometrosPorRuta(): number {
    return this.estadisticasGlobales.kilometrosTotales / this.estadisticasGlobales.totalRutas;
  }

  calcularMediaPuntosPorRuta(): number {
    return this.estadisticasGlobales.totalPuntos / this.estadisticasGlobales.totalRutas;
  }
}
