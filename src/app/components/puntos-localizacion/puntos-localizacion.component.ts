import { Component, OnInit } from '@angular/core';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../app.module';

interface PuntoLocalizacion {
  id: string;
  nombre: string;
  descripcion: string;
  latitud: number;
  longitud: number;
  fechaCreacion: string;
  foto: string;
  usuarioCreador: string;
}

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

  constructor() { }

  async ngOnInit(): Promise<void> {
    try {
      await this.cargarPuntosLocalizacion();
    } catch (error) {
      this.error = 'Error al cargar los puntos de localización';
      console.error(error);
    } finally {
      this.loading = false;
    }
  }

  async cargarPuntosLocalizacion(): Promise<void> {
    const puntosCollection = collection(db, 'puntos_localizacion');
    const puntosSnapshot = await getDocs(puntosCollection);

    this.puntosLocalizacion = puntosSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        nombre: data['nombre'] || '',
        descripcion: data['descripcion'] || '',
        latitud: data['latitud'] || 0,
        longitud: data['longitud'] || 0,
        fechaCreacion: data['fechaCreacion'] || '',
        foto: data['foto'] || '',
        usuarioCreador: data['usuarioCreador'] || ''
      };
    });
  }

  // Función para abrir en Google Maps
  abrirEnGoogleMaps(latitud: number, longitud: number): void {
    window.open(`https://www.google.com/maps?q=${latitud},${longitud}`, '_blank');
  }
}
