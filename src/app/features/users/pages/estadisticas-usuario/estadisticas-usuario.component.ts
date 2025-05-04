import { Component, OnInit } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-estadisticas-usuario',
  templateUrl: './estadisticas-usuario.component.html',
  styleUrls: ['./estadisticas-usuario.component.css']
})
export class EstadisticasUsuarioComponent implements OnInit {
  // Estados de la interfaz
  loading = false;
  error = '';
  usuarioSeleccionado: any = null;
  periodoSeleccionado = 'mensual';

  // Búsqueda de usuarios
  usuarioBusqueda = '';

  // Lista de usuarios disponibles
  usuarios = [
    {
      id: 1,
      nombre: 'Juan Pérez',
      email: 'juan.perez@ejemplo.com',
      rol: 'Administrador',
      fechaRegistro: new Date('2024-12-15'),
      ultimoAcceso: new Date('2025-04-28'),
      imagen: null
    },
    {
      id: 2,
      nombre: 'María García',
      email: 'maria.garcia@ejemplo.com',
      rol: 'Editor',
      fechaRegistro: new Date('2025-01-10'),
      ultimoAcceso: new Date('2025-04-25'),
      imagen: null
    },
    {
      id: 3,
      nombre: 'Carlos Rodríguez',
      email: 'carlos.rodriguez@ejemplo.com',
      rol: 'Usuario',
      fechaRegistro: new Date('2025-02-05'),
      ultimoAcceso: new Date('2025-04-27'),
      imagen: null
    },
    {
      id: 4,
      nombre: 'Ana Martínez',
      email: 'ana.martinez@ejemplo.com',
      rol: 'Moderador',
      fechaRegistro: new Date('2024-11-20'),
      ultimoAcceso: new Date('2025-04-22'),
      imagen: null
    },
    {
      id: 5,
      nombre: 'David López',
      email: 'david.lopez@ejemplo.com',
      rol: 'Usuario',
      fechaRegistro: new Date('2025-03-15'),
      ultimoAcceso: new Date('2025-04-26'),
      imagen: null
    }
  ];

  // Datos de estadísticas del usuario seleccionado
  estadisticasUsuario = {
    totalRutas: 28,
    totalPuntos: 142,
    totalKilometros: 756.3,
    mediaKilometros: 27.01,
    tiempoTotal: '46h 28m',
    mediaVelocidad: '16.4 km/h',
    altitudMaxima: 1842,
    desnivelAcumulado: 12350,
    rutaMasLarga: {
      nombre: 'Senda del Oso',
      distancia: 42.8,
      fecha: new Date('2025-03-15')
    },
    puntosInteres: [
      { nombre: 'Mirador del Valle', visitas: 5 },
      { nombre: 'Cascada del Purgatorio', visitas: 3 },
      { nombre: 'Pico de la Miel', visitas: 2 },
      { nombre: 'Laguna Grande', visitas: 4 },
      { nombre: 'Refugio Zabala', visitas: 2 }
    ],
    actividadMensual: [
      { mes: 'Noviembre', rutas: 3, kilometros: 82 },
      { mes: 'Diciembre', rutas: 5, kilometros: 124 },
      { mes: 'Enero', rutas: 4, kilometros: 96 },
      { mes: 'Febrero', rutas: 6, kilometros: 178 },
      { mes: 'Marzo', rutas: 7, kilometros: 214 },
      { mes: 'Abril', rutas: 3, kilometros: 62 }
    ],
    distribucionTipos: [
      { tipo: 'Senderismo', porcentaje: 64, rutas: 18 },
      { tipo: 'Ciclismo', porcentaje: 21, rutas: 6 },
      { tipo: 'Running', porcentaje: 11, rutas: 3 },
      { tipo: 'Otro', porcentaje: 4, rutas: 1 }
    ],
    logrosConseguidos: 12,
    totalLogros: 25,
    retosCompletados: 5,
    retosActivos: 2
  };

  // Actividad reciente del usuario
  actividadReciente = [
    {
      tipo: 'ruta',
      nombre: 'Ruta del Pico de la Miel',
      fecha: new Date('2025-04-28'),
      kilometros: 14.5,
      tiempo: '2h 30m'
    },
    {
      tipo: 'punto',
      nombre: 'Mirador del Valle',
      fecha: new Date('2025-04-25'),
      ubicacion: 'Sierra de Guadarrama'
    },
    {
      tipo: 'ruta',
      nombre: 'Ruta circular La Pedriza',
      fecha: new Date('2025-04-15'),
      kilometros: 12.8,
      tiempo: '2h 45m'
    },
    {
      tipo: 'logro',
      nombre: 'Explorador de Altura',
      fecha: new Date('2025-04-10'),
      descripcion: 'Visitar 5 puntos con altitud superior a 1500m'
    },
    {
      tipo: 'reto',
      nombre: '100km en un mes',
      fecha: new Date('2025-04-05'),
      progreso: 85,
      descripcion: 'Completar 100km en rutas registradas durante un mes'
    }
  ];

  constructor() { }

  ngOnInit(): void {
    // Al iniciar, seleccionamos el primer usuario por defecto
    if (this.usuarios.length > 0) {
      this.seleccionarUsuario(this.usuarios[0]);
    }
  }

  // Método para seleccionar un usuario y cargar sus estadísticas
  seleccionarUsuario(usuario: any): void {
    this.loading = true;
    this.usuarioSeleccionado = usuario;

    // Simulación de carga de datos
    setTimeout(() => {
      // Aquí iría la petición al servicio para cargar las estadísticas del usuario
      this.loading = false;
    }, 1200);
  }

  // Método para filtrar usuarios en la búsqueda
  filtrarUsuarios(): any[] {
    if (!this.usuarioBusqueda) {
      return this.usuarios;
    }

    const filtro = this.usuarioBusqueda.toLowerCase();
    return this.usuarios.filter(usuario => {
      return usuario.nombre.toLowerCase().includes(filtro) ||
             usuario.email.toLowerCase().includes(filtro);
    });
  }

  // Método para cambiar el período de estadísticas
  cambiarPeriodo(periodo: string): void {
    this.periodoSeleccionado = periodo;
    this.loading = true;

    // Simulación de carga de datos para el nuevo período
    setTimeout(() => {
      // Aquí iría la petición al servicio para cargar las estadísticas del período seleccionado
      this.loading = false;
    }, 800);
  }

  // Método para formatear fecha
  formatFecha(fecha: Date): string {
    return fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Método para formatear fecha relativa
  formatearFechaRelativa(fecha: Date): string {
    const ahora = new Date();
    const diferenciaDias = Math.floor((ahora.getTime() - fecha.getTime()) / (1000 * 3600 * 24));

    if (diferenciaDias === 0) return 'Hoy';
    if (diferenciaDias === 1) return 'Ayer';
    if (diferenciaDias < 7) return `Hace ${diferenciaDias} días`;
    if (diferenciaDias < 30) return `Hace ${Math.floor(diferenciaDias / 7)} semanas`;
    return `Hace ${Math.floor(diferenciaDias / 30)} meses`;
  }

  // Método para calcular el color de la barra de progreso según el valor
  getColorProgreso(valor: number): string {
    if (valor >= 75) return 'high';
    if (valor >= 40) return 'medium';
    return 'low';
  }

  // Método para exportar estadísticas del usuario
  exportarEstadisticas(): void {
    if (!this.usuarioSeleccionado) return;

    // Aquí iría la lógica para exportar las estadísticas a CSV/PDF
    console.log('Exportando estadísticas de', this.usuarioSeleccionado.nombre);
    alert(`Exportando estadísticas de ${this.usuarioSeleccionado.nombre} en formato PDF...`);
  }
}
