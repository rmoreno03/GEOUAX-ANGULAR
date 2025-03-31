import { Component, OnInit } from '@angular/core';
import { PuntoLocalizacion } from '../../../../models/punto-localizacion.model';
import { PuntosLocalizacionService } from '../../services/puntosLocalizacion.service';


@Component({
  selector: 'app-puntos-localizacion',
  templateUrl: './puntos-localizacion.component.html',
  styleUrls: ['./puntos-localizacion.component.css'],
  standalone: false
})
export class PuntosLocalizacionComponent implements OnInit {
  puntosLocalizacion: PuntoLocalizacion[] = [];
  loading = true;
  error = '';

  constructor(
    private puntosLocalizacionService: PuntosLocalizacionService
  ) { }

  async ngOnInit(): Promise<void> {
    try {
      this.puntosLocalizacion = await this.puntosLocalizacionService.cargarPuntosLocalizacion();
    } catch (error) {
      this.error = 'Error al cargar los puntos de localización';
      console.error(error);
    } finally {
      this.loading = false;
    }
  }


  // Función para abrir en Google Maps
  abrirEnGoogleMaps(latitud: number, longitud: number): void {
    window.open(`https://www.google.com/maps?q=${latitud},${longitud}`, '_blank');
  }
}
