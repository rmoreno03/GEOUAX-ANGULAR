import { Component, OnInit } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-comparativas',
  templateUrl: './comparativas.component.html',
  styleUrls: ['./comparativas.component.css']
})
export class ComparativasComponent implements OnInit {
  // Estados de la interfaz
  loading = false;
  error = '';
  filtroActivo = 'mensual';
  amigosSeleccionados: string[] = ['Amigo 1']; // Por defecto seleccionamos al Amigo 1

  // Datos simulados
  datosUsuario = {
    nombre: 'Carlos Rodríguez',
    imagen: null,
    totalKilometros: 756.3,
    totalRutas: 28,
    mediaKilometros: 27.01,
    totalPuntos: 142
  };

  // Lista de amigos para comparar
  listaAmigos = [
    { id: 'amigo1', nombre: 'Amigo 1', imagen: null, seleccionado: true },
    { id: 'amigo2', nombre: 'Amigo 2', imagen: null, seleccionado: false },
    { id: 'amigo3', nombre: 'Amigo 3', imagen: null, seleccionado: false },
    { id: 'amigo4', nombre: 'Amigo 4', imagen: null, seleccionado: false },
    { id: 'amigo5', nombre: 'Amigo 5', imagen: null, seleccionado: false }
  ];

  // Datos para comparativas mensuales
  datosComparativaMensual = [
    { mes: 'Enero', usuario: 124.5, amigo1: 98.2, amigo2: 156.8, amigo3: 65.3, amigo4: 132.7, amigo5: 84.9 },
    { mes: 'Febrero', usuario: 98.2, amigo1: 152.7, amigo2: 104.5, amigo3: 87.2, amigo4: 78.3, amigo5: 126.4 },
    { mes: 'Marzo', usuario: 156.8, amigo1: 139.5, amigo2: 87.3, amigo3: 164.8, amigo4: 125.7, amigo5: 95.2 },
    { mes: 'Abril', usuario: 187.4, amigo1: 116.8, amigo2: 192.5, amigo3: 75.9, amigo4: 163.2, amigo5: 117.8 }
  ];

  // Datos para comparativas por tipo de actividad
  datosComparativaTipoActividad = [
    { tipo: 'Senderismo', usuario: 45, amigo1: 32, amigo2: 56, amigo3: 28, amigo4: 48, amigo5: 37 },
    { tipo: 'Ciclismo', usuario: 32, amigo1: 48, amigo2: 25, amigo3: 42, amigo4: 18, amigo5: 52 },
    { tipo: 'Running', usuario: 18, amigo1: 12, amigo2: 8, amigo3: 35, amigo4: 24, amigo5: 15 },
    { tipo: 'Urbana', usuario: 5, amigo1: 8, amigo2: 11, amigo3: 4, amigo4: 10, amigo5: 6 }
  ];

  // Datos de ranking global
  datosRankingGlobal = [
    { posicion: 1, nombre: 'Usuario Top 1', kilometros: 1247.5, rutas: 45, imagen: null },
    { posicion: 2, nombre: 'Usuario Top 2', kilometros: 1124.8, rutas: 42, imagen: null },
    { posicion: 3, nombre: 'Usuario Top 3', kilometros: 984.3, rutas: 39, imagen: null },
    { posicion: 4, nombre: 'Usuario Top 4', kilometros: 876.2, rutas: 37, imagen: null },
    { posicion: 5, nombre: 'Usuario Top 5', kilometros: 812.5, rutas: 36, imagen: null },
    // Posición del usuario actual
    { posicion: 27, nombre: 'Carlos Rodríguez', kilometros: 756.3, rutas: 28, imagen: null, destacado: true },
    // Más usuarios
    { posicion: 28, nombre: 'Usuario 28', kilometros: 732.1, rutas: 27, imagen: null },
    { posicion: 29, nombre: 'Usuario 29', kilometros: 705.8, rutas: 26, imagen: null },
    { posicion: 30, nombre: 'Usuario 30', kilometros: 678.9, rutas: 24, imagen: null }
  ];

  constructor() { }

  ngOnInit(): void {
    this.cargarDatosComparativos();
  }

  cargarDatosComparativos(): void {
    this.loading = true;

    // Simulación de carga de datos
    setTimeout(() => {
      // Aquí iría la petición al servicio para cargar datos reales
      this.loading = false;
    }, 1200);
  }

  cambiarFiltro(filtro: string): void {
    this.filtroActivo = filtro;
  }

  toggleAmigoSeleccionado(amigoId: string): void {
    const indice = this.listaAmigos.findIndex(amigo => amigo.id === amigoId);

    if (indice !== -1) {
      this.listaAmigos[indice].seleccionado = !this.listaAmigos[indice].seleccionado;

      // Actualizar lista de amigos seleccionados
      this.amigosSeleccionados = this.listaAmigos
        .filter(amigo => amigo.seleccionado)
        .map(amigo => amigo.nombre);
    }
  }

  // Método para renderizar los datos según los amigos seleccionados
  obtenerDatosFiltrados(): any[] {
    if (this.filtroActivo === 'mensual') {
      return this.datosComparativaMensual;
    } else {
      return this.datosComparativaTipoActividad;
    }
  }

  // Método para calcular posición respecto a los amigos
  calcularPosicionEntrePares(): number {
    // Lógica simulada
    return 2;
  }

  // Método para obtener el percentil del usuario
  obtenerPercentilUsuario(): number {
    // Simulando que el usuario está en el puesto 27 de 100
    return 73; // Está en el percentil 73 (mejor que el 73% de usuarios)
  }
}
