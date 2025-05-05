import { Component, OnInit, Input } from '@angular/core';
import { RutasService } from '../../services/rutas.service';

@Component({
  selector: 'app-comparar-transportes',
  templateUrl: './comparar-transportes.component.html',
  styleUrls: ['./comparar-transportes.component.css'],
  standalone: false
})
export class CompararTransportesComponent implements OnInit {
  @Input() distanciaKm?: number;
  @Input() tipoActual?: string;

  opciones: any[] = [];

  showChart = false;
  chartData: any[] = [];

  constructor(private rutasService: RutasService) {}

  ngOnInit(): void {
    this.opciones = this.rutasService.getComparativaTransportes(this.distanciaKm ?? 0);

    this.chartData = this.opciones.map(option => ({
      name: option.type,
      value: option.emission
    }));

    this.showChart = this.chartData.length > 1;
  }

  formatNumber(value: number): string {
    return value?.toFixed(2) || '0.00';
  }

  calcularPorcentajeAhorro(emision: number): number {
    const maxEmision = Math.max(...this.opciones.map(o => o.emission));
    if (maxEmision === 0) return 0;
    return ((maxEmision - emision) / maxEmision) * 100;
  }

  calcularBeneficioAnual(emision: number): number {
    const frecuenciaSemanal = 3;
    const semanasAnuales = 52;
    return emision * frecuenciaSemanal * semanasAnuales;
  }

  cerrar(): void {
    // En PrimeNG se cierra desde el componente padre, así que esto queda vacío
  }
}
