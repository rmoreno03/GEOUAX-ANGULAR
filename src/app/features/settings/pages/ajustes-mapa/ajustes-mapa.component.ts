import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, getDoc, updateDoc, setDoc } from '@angular/fire/firestore';

interface MapSettings {
  estilo: string;
  mostrarTrafico: boolean;
  mostrarTerreno3D: boolean;
  rotacionAutomatica: boolean;
  modoDia: boolean;
  mostrarEdificios3D: boolean;
  mostrarPuntoInteres: boolean;
  zoomPredeterminado: number;
  regiones: {
    favoritas: string[];
  };
}

@Component({
  standalone: false,
  selector: 'app-ajustes-mapa',
  templateUrl: './ajustes-mapa.component.html',
  styleUrls: ['./ajustes-mapa.component.css']
})
export class AjustesMapaComponent implements OnInit {
  mapForm: FormGroup;
  loading = false;
  success = false;
  error = '';

  estilosDisponibles = [
    { id: 'streets-v12', nombre: 'Calles (predeterminado)' },
    { id: 'outdoors-v12', nombre: 'Exteriores' },
    { id: 'light-v11', nombre: 'Claro' },
    { id: 'dark-v11', nombre: 'Oscuro' },
    { id: 'satellite-v9', nombre: 'Satélite' },
    { id: 'satellite-streets-v12', nombre: 'Satélite con calles' },
    { id: 'navigation-day-v1', nombre: 'Navegación - Día' },
    { id: 'navigation-night-v1', nombre: 'Navegación - Noche' }
  ];

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private firestore: Firestore
  ) {
    // Inicializar formulario con valores por defecto
    this.mapForm = this.fb.group({
      estilo: ['streets-v12'],
      mostrarTrafico: [false],
      mostrarTerreno3D: [true],
      rotacionAutomatica: [true],
      modoDia: [true],
      mostrarEdificios3D: [true],
      mostrarPuntoInteres: [true],
      zoomPredeterminado: [12],
      regiones: this.fb.group({
        favoritas: [[]]
      })
    });
  }

  ngOnInit(): void {
    this.loadMapSettings();
  }

  /**
   * Carga los ajustes del mapa desde Firestore
   */
  async loadMapSettings(): Promise<void> {
    this.loading = true;

    try {
      const userId = this.auth.currentUser?.uid;

      if (!userId) {
        throw new Error('Usuario no autenticado');
      }

      const mapSettingsDoc = doc(this.firestore, `usuarios/${userId}/preferencias/mapa`);
      const docSnap = await getDoc(mapSettingsDoc);

      if (docSnap.exists()) {
        // Si existen ajustes guardados, cargarlos en el formulario
        const settings = docSnap.data() as MapSettings;

        this.mapForm.patchValue({
          estilo: settings.estilo || 'streets-v12',
          mostrarTrafico: settings.mostrarTrafico ?? false,
          mostrarTerreno3D: settings.mostrarTerreno3D ?? true,
          rotacionAutomatica: settings.rotacionAutomatica ?? true,
          modoDia: settings.modoDia ?? true,
          mostrarEdificios3D: settings.mostrarEdificios3D ?? true,
          mostrarPuntoInteres: settings.mostrarPuntoInteres ?? true,
          zoomPredeterminado: settings.zoomPredeterminado || 12,
          regiones: {
            favoritas: settings.regiones?.favoritas || []
          }
        });
      }

      this.loading = false;
    } catch (error) {
      console.error('Error al cargar ajustes del mapa:', error);
      this.error = 'No se pudieron cargar los ajustes del mapa. Intenta de nuevo más tarde.';
      this.loading = false;
    }
  }

  /**
   * Guarda los ajustes del mapa en Firestore
   */
  async saveMapSettings(): Promise<void> {
    this.loading = true;
    this.success = false;
    this.error = '';

    try {
      const userId = this.auth.currentUser?.uid;

      if (!userId) {
        throw new Error('Usuario no autenticado');
      }

      const mapSettingsDoc = doc(this.firestore, `usuarios/${userId}/preferencias/mapa`);

      // Obtener valores del formulario
      const settings = this.mapForm.value as MapSettings;

      // Guardar en Firestore
      await updateDoc(mapSettingsDoc, {
        estilo: settings.estilo,
        mostrarTrafico: settings.mostrarTrafico,
        mostrarTerreno3D: settings.mostrarTerreno3D,
        rotacionAutomatica: settings.rotacionAutomatica,
        modoDia: settings.modoDia,
        mostrarEdificios3D: settings.mostrarEdificios3D,
        mostrarPuntoInteres: settings.mostrarPuntoInteres,
        zoomPredeterminado: settings.zoomPredeterminado,
        regiones: settings.regiones,
        lastUpdated: new Date()
      }).catch(async (err) => {
        // Si el documento no existe, crearlo
        if (err.code === 'not-found') {
          await setDoc(mapSettingsDoc, {
            estilo: settings.estilo,
            mostrarTrafico: settings.mostrarTrafico,
            mostrarTerreno3D: settings.mostrarTerreno3D,
            rotacionAutomatica: settings.rotacionAutomatica,
            modoDia: settings.modoDia,
            mostrarEdificios3D: settings.mostrarEdificios3D,
            mostrarPuntoInteres: settings.mostrarPuntoInteres,
            zoomPredeterminado: settings.zoomPredeterminado,
            regiones: settings.regiones,
            lastUpdated: new Date()
          });
        } else {
          throw err;
        }
      });

      this.success = true;
      this.loading = false;

      // Mostrar mensaje de éxito durante 3 segundos
      setTimeout(() => {
        this.success = false;
      }, 3000);

    } catch (error) {
      console.error('Error al guardar ajustes del mapa:', error);
      this.error = 'No se pudieron guardar los ajustes del mapa. Intenta de nuevo más tarde.';
      this.loading = false;
    }
  }

  /**
   * Restaura los valores por defecto
   */
  restoreDefaults(): void {
    this.mapForm.setValue({
      estilo: 'streets-v12',
      mostrarTrafico: false,
      mostrarTerreno3D: true,
      rotacionAutomatica: true,
      modoDia: true,
      mostrarEdificios3D: true,
      mostrarPuntoInteres: true,
      zoomPredeterminado: 12,
      regiones: {
        favoritas: []
      }
    });
  }
}
