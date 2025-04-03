import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PuntosLocalizacionService } from '../../services/puntosLocalizacion.service';
import { PuntoLocalizacion } from '../../../../models/punto-localizacion.model';

@Component({
  standalone: false,
  selector: 'app-detalle-punto',
  templateUrl: './detalle-punto.component.html',
  styleUrls: ['./detalle-punto.component.css']
})
export class DetallePuntoComponent implements OnInit {
  punto?: PuntoLocalizacion;
  loading = true;
  error: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private puntosService: PuntosLocalizacionService
  ) {}

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      try {
        const punto = await this.puntosService.obtenerPuntoPorId(id);
        this.punto = punto !== null ? punto : undefined;
      } catch (err) {
        this.error = 'No se pudo cargar el punto.';
      } finally {
        this.loading = false;
      }
    }
  }

  async eliminar(): Promise<void> {
    if (this.punto?.id && confirm('¿Estás seguro de que deseas eliminar este punto?')) {
      await this.puntosService.eliminarPunto(this.punto.id);
      this.router.navigate(['/puntos-localizacion']);
    }
  }

  volver(): void {
    this.router.navigate(['/puntos-localizacion']);
  }
}
