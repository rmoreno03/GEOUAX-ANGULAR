import { Component, Input} from '@angular/core';
import { Ruta } from '../../../../models/ruta.model';
import { RutasService } from '../../services/rutas.service';

@Component({
  selector: 'app-huella-carbono',
  templateUrl: './huella-carbono.component.html',
  styleUrls: ['./huella-carbono.component.css'],
  standalone: false
})
export class HuellaCarbonoComponent  {
  @Input() ruta!: Ruta;
  @Input() mostrarActualizarBtn = true;

  calculando = false;
  showDetails = false;
  mostrarDialogoComparacion = false;

  objectKeys = Object.keys;

  constructor(private rutasService: RutasService) {}


  getEmissionClass(): string {
    if (!this.ruta?.carbonFootprint) return 'eco-neutral';

    const emission = this.ruta.carbonFootprint.totalEmission;
    if (emission === 0) return 'eco-zero';
    if (emission < 0.5) return 'eco-low';
    if (emission < 2) return 'eco-medium';
    return 'eco-high';
  }

  getEmissionLabel(): string {
    if (!this.ruta?.carbonFootprint) return 'Sin calcular';

    const emission = this.ruta.carbonFootprint.totalEmission;
    if (emission === 0) return 'Cero emisiones';
    if (emission < 0.5) return 'Impacto bajo';
    if (emission < 2) return 'Impacto moderado';
    return 'Impacto alto';
  }

  formatNumber(value: number): string {
    return value?.toFixed(2) || '0.00';
  }

  async actualizarHuella(): Promise<void> {
    if (!this.ruta?.id) return;

    this.calculando = true;

    try {
      const result = await this.rutasService.calcularHuellaCarbono(this.ruta.id);

      if (result) {
        this.ruta = {
          ...this.ruta,
          carbonFootprint: result
        };
      }
    } catch (error) {
      console.error('Error al calcular huella de carbono:', error);
    } finally {
      this.calculando = false;
    }
  }

  toggleDetails(): void {
    this.showDetails = !this.showDetails;
  }

  abrirComparacionTransportes(): void {
    this.mostrarDialogoComparacion = true;
  }
}
