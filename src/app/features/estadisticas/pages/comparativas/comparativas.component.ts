import { Component, OnInit } from '@angular/core';

interface DatoComparativo {
  mes?: string;
  tipo?: string;
  usuario: number;
  amigo1: number;
  amigo2: number;
  amigo3: number;
  amigo4: number;
  amigo5: number;
  [key: string]: number | string | undefined;
}

@Component({
  standalone: false,
  selector: 'app-comparativas',
  templateUrl: './comparativas.component.html',
  styleUrls: ['./comparativas.component.css']
})
export class ComparativasComponent implements OnInit {
  loading = false;
  error = '';
  filtroActivo: 'mensual' | 'actividad' = 'mensual';

  datosUsuario = {
    nombre: 'Raúl Moreno Moya',
    imagen: null,
    totalKilometros: 756.3,
    totalRutas: 28,
    mediaKilometros: 27.01,
    totalPuntos: 142
  };

  listaAmigos = [
    { id: 'amigo1', nombre: 'Amigo 1', imagen: null, seleccionado: true },
    { id: 'amigo2', nombre: 'Amigo 2', imagen: null, seleccionado: false },
    { id: 'amigo3', nombre: 'Amigo 3', imagen: null, seleccionado: false },
    { id: 'amigo4', nombre: 'Amigo 4', imagen: null, seleccionado: false },
    { id: 'amigo5', nombre: 'Amigo 5', imagen: null, seleccionado: false }
  ];

  datosComparativaMensual: DatoComparativo[] = [
    { mes: 'Enero', usuario: 124.5, amigo1: 98.2, amigo2: 156.8, amigo3: 65.3, amigo4: 132.7, amigo5: 84.9 },
    { mes: 'Febrero', usuario: 98.2, amigo1: 152.7, amigo2: 104.5, amigo3: 87.2, amigo4: 78.3, amigo5: 126.4 },
    { mes: 'Marzo', usuario: 156.8, amigo1: 139.5, amigo2: 87.3, amigo3: 164.8, amigo4: 125.7, amigo5: 95.2 },
    { mes: 'Abril', usuario: 187.4, amigo1: 116.8, amigo2: 192.5, amigo3: 75.9, amigo4: 163.2, amigo5: 117.8 }
  ];

  datosComparativaTipoActividad: DatoComparativo[] = [
    { tipo: 'Senderismo', usuario: 45, amigo1: 32, amigo2: 56, amigo3: 28, amigo4: 48, amigo5: 37 },
    { tipo: 'Ciclismo', usuario: 32, amigo1: 48, amigo2: 25, amigo3: 42, amigo4: 18, amigo5: 52 },
    { tipo: 'Running', usuario: 18, amigo1: 12, amigo2: 8, amigo3: 35, amigo4: 24, amigo5: 15 },
    { tipo: 'Urbana', usuario: 5, amigo1: 8, amigo2: 11, amigo3: 4, amigo4: 10, amigo5: 6 }
  ];

  datosRankingGlobal = [
    { posicion: 1, nombre: 'Usuario Top 1', kilometros: 1247.5, rutas: 45, imagen: null },
    { posicion: 2, nombre: 'Usuario Top 2', kilometros: 1124.8, rutas: 42, imagen: null },
    { posicion: 3, nombre: 'Usuario Top 3', kilometros: 984.3, rutas: 39, imagen: null },
    { posicion: 4, nombre: 'Usuario Top 4', kilometros: 876.2, rutas: 37, imagen: null },
    { posicion: 5, nombre: 'Usuario Top 5', kilometros: 812.5, rutas: 36, imagen: null },
    { posicion: 27, nombre: 'Raúl Moreno', kilometros: 756.3, rutas: 28, imagen: null, destacado: true },
    { posicion: 28, nombre: 'Usuario 28', kilometros: 732.1, rutas: 27, imagen: null },
    { posicion: 29, nombre: 'Usuario 29', kilometros: 705.8, rutas: 26, imagen: null },
    { posicion: 30, nombre: 'Usuario 30', kilometros: 678.9, rutas: 24, imagen: null }
  ];

  ngOnInit(): void {
    this.cargarDatosComparativos();
  }

  cargarDatosComparativos(): void {
    this.loading = true;
    setTimeout(() => {
      this.loading = false;
    }, 1000);
  }

  cambiarFiltro(filtro: 'mensual' | 'actividad'): void {
    this.filtroActivo = filtro;
  }

  toggleAmigoSeleccionado(amigoId: string): void {
    const amigo = this.listaAmigos.find(a => a.id === amigoId);
    if (amigo) {
      amigo.seleccionado = !amigo.seleccionado;
    }
  }

  obtenerDatosFiltrados(): DatoComparativo[] {
    return this.filtroActivo === 'mensual'
      ? this.datosComparativaMensual
      : this.datosComparativaTipoActividad;
  }

  calcularPosicionEntrePares(): number {
    return 2;
  }

  obtenerPercentilUsuario(): number {
    return 73;
  }

  convertirAAltura(valor: unknown): number {
    return typeof valor === 'number' ? valor * 0.5 : 0;
  }

}
