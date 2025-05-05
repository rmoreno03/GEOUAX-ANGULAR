import { Component, OnInit } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-impacto-medioambiental',
  templateUrl: './impacto-medioambiental.component.html',
  styleUrls: ['./impacto-medioambiental.component.css']
})
export class ImpactoMedioambientalComponent implements OnInit {
  // Estados de la interfaz
  loading = false;
  error = '';

  // Datos simulados para estadísticas de impacto medioambiental
  datosPersonales = {
    rutasAlternativas: 82,
    kilometrosAhorro: 529,
    co2Reducido: 78.5, // en kg
    arbolesEquivalentes: 3.6,
    reutasVerdes: 27,
    calificacionSostenibilidad: 'A' // A, B, C, D, E
  };

  // Datos globales
  datosGlobales = {
    totalCO2Reducido: 42680, // en kg
    kilometrosAlternativos: 286540,
    usuariosVerdes: 8452,
    rutasVerdesCreadas: 15680,
    arbolesEquivalentes: 1945,
    litrosCombustibleAhorrado: 25680
  };

  // Evolución de ahorro mensual
  evolucionMensual = [
    { mes: 'Noviembre', co2: 5.2, km: 38 },
    { mes: 'Diciembre', co2: 7.8, km: 52 },
    { mes: 'Enero', co2: 10.5, km: 72 },
    { mes: 'Febrero', co2: 12.2, km: 86 },
    { mes: 'Marzo', co2: 18.6, km: 124 },
    { mes: 'Abril', co2: 24.2, km: 157 }
  ];

  // Consejos sostenibles
  consejosSostenibles = [
    {
      titulo: 'Planifica rutas más eficientes',
      descripcion: 'Utiliza rutas circulares y evita trayectos redundantes para reducir la distancia total.',
      icono: 'route'
    },
    {
      titulo: 'Usa transporte público en el acceso',
      descripcion: 'Considera usar transporte público para llegar al inicio de tus rutas cuando sea posible.',
      icono: 'bus'
    },
    {
      titulo: 'Compartir vehículo',
      descripcion: 'Coordínate con otros usuarios para compartir vehículo y reducir la huella de carbono.',
      icono: 'car-side'
    },
    {
      titulo: 'Lleva tu basura de vuelta',
      descripcion: 'No dejes residuos en las rutas y contribuye a mantener los espacios naturales limpios.',
      icono: 'trash-restore'
    }
  ];

  // Proyectos de reforestación
  proyectosReforestacion = [
    {
      nombre: 'Reforestación Sierra Norte',
      arboles: 850,
      fechaInicio: new Date('2024-10-15'),
      participantes: 124,
      completado: 78 // porcentaje
    },
    {
      nombre: 'Recuperación Bosque Mediterráneo',
      arboles: 1250,
      fechaInicio: new Date('2024-11-22'),
      participantes: 186,
      completado: 45
    },
    {
      nombre: 'Cinturón Verde Madrid',
      arboles: 620,
      fechaInicio: new Date('2025-02-08'),
      participantes: 92,
      completado: 30
    }
  ];


  ngOnInit(): void {
    this.cargarDatosImpacto();
  }

  cargarDatosImpacto(): void {
    this.loading = true;

    // Simulación de carga de datos
    setTimeout(() => {
      // Aquí iría la petición al servicio para cargar datos reales
      this.loading = false;
    }, 1200);
  }

  // Métodos para calcular estadísticas derivadas
  calcularPromedioAhorroCO2(): number {
    let total = 0;
    this.evolucionMensual.forEach(mes => total += mes.co2);
    return total / this.evolucionMensual.length;
  }

  obtenerClaseCalificacion(): string {
    switch (this.datosPersonales.calificacionSostenibilidad) {
      case 'A': return 'eco-a';
      case 'B': return 'eco-b';
      case 'C': return 'eco-c';
      case 'D': return 'eco-d';
      case 'E': return 'eco-e';
      default: return 'eco-e';
    }
  }

  calcularPorcentajeUsuariosVerdes(): number {
    // Suponiendo un total global de 15000 usuarios
    return (this.datosGlobales.usuariosVerdes / 15000) * 100;
  }

  // Método para unirse a proyectos (simulado)
  unirseProyecto(proyectoNombre: string): void {
    alert(`Te has unido al proyecto: ${proyectoNombre}`);
    // Aquí iría la lógica para unirse realmente al proyecto
  }
}
