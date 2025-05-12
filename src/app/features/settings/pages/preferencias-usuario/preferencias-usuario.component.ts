import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';

interface UserPreferences {
  unidadMedida: string;
  tipoRutaPreferida: string;
  vehiculos: {
    [key: string]: boolean;
  };
  notificaciones: {
    rutas: boolean;
    mensajes: boolean;
    eventos: boolean;
  };
  privacidad: {
    perfilPublico: boolean;
    mostrarHistorialRutas: boolean;
    compartirEstadisticas: boolean;
  };
}

@Component({
  standalone: false,
  selector: 'app-preferencias-usuario',
  templateUrl: './preferencias-usuario.component.html',
  styleUrls: ['./preferencias-usuario.component.css']
})
export class PreferenciasUsuarioComponent implements OnInit {
  preferencesForm: FormGroup;
  loading = false;
  success = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private firestore: Firestore
  ) {
    // Inicializar formulario con valores por defecto
    this.preferencesForm = this.fb.group({
      unidadMedida: ['km'],
      tipoRutaPreferida: ['driving'],
      vehiculos: this.fb.group({
        coche: [true],
        bicicleta: [true],
        moto: [false],
        caminar: [true]
      }),
      notificaciones: this.fb.group({
        rutas: [true],
        mensajes: [true],
        eventos: [true]
      }),
      privacidad: this.fb.group({
        perfilPublico: [true],
        mostrarHistorialRutas: [false],
        compartirEstadisticas: [true]
      })
    });
  }

  ngOnInit(): void {
    this.loadUserPreferences();
  }

  /**
   * Carga las preferencias del usuario desde Firestore
   */
  async loadUserPreferences(): Promise<void> {
    this.loading = true;

    try {
      const userId = this.auth.currentUser?.uid;

      if (!userId) {
        throw new Error('Usuario no autenticado');
      }

      const userPrefsDoc = doc(this.firestore, `usuarios/${userId}/preferencias/configuracion`);
      const docSnap = await getDoc(userPrefsDoc);

      if (docSnap.exists()) {
        // Si existen preferencias guardadas, cargarlas en el formulario
        const preferences = docSnap.data() as UserPreferences;

        this.preferencesForm.patchValue({
          unidadMedida: preferences.unidadMedida || 'km',
          tipoRutaPreferida: preferences.tipoRutaPreferida || 'driving',
          vehiculos: {
            coche: preferences.vehiculos?.['coche'] ?? true,
            bicicleta: preferences.vehiculos?.['bicicleta'] ?? true,
            moto: preferences.vehiculos?.['moto'] ?? false,
            caminar: preferences.vehiculos?.['caminar'] ?? true
          },
          notificaciones: {
            rutas: preferences.notificaciones?.rutas ?? true,
            mensajes: preferences.notificaciones?.mensajes ?? true,
            eventos: preferences.notificaciones?.eventos ?? true
          },
          privacidad: {
            perfilPublico: preferences.privacidad?.perfilPublico ?? true,
            mostrarHistorialRutas: preferences.privacidad?.mostrarHistorialRutas ?? false,
            compartirEstadisticas: preferences.privacidad?.compartirEstadisticas ?? true
          }
        });
      }

      this.loading = false;
    } catch (error) {
      console.error('Error al cargar preferencias:', error);
      this.error = 'No se pudieron cargar las preferencias. Intenta de nuevo más tarde.';
      this.loading = false;
    }
  }

  /**
   * Guarda las preferencias del usuario en Firestore
   */
  async savePreferences(): Promise<void> {
    this.loading = true;
    this.success = false;
    this.error = '';

    try {
      const userId = this.auth.currentUser?.uid;

      if (!userId) {
        throw new Error('Usuario no autenticado');
      }

      const userPrefsDoc = doc(this.firestore, `usuarios/${userId}/preferencias/configuracion`);

      // Obtener valores del formulario
      const preferences = this.preferencesForm.value as UserPreferences;

      // Guardar en Firestore
      await updateDoc(userPrefsDoc, {
        unidadMedida: preferences.unidadMedida,
        tipoRutaPreferida: preferences.tipoRutaPreferida,
        vehiculos: preferences.vehiculos,
        notificaciones: preferences.notificaciones,
        privacidad: preferences.privacidad,
        lastUpdated: new Date()
      }).catch(async (err) => {
        // Si el documento no existe, crearlo
        if (err.code === 'not-found') {
          await setDoc(userPrefsDoc, {
            unidadMedida: preferences.unidadMedida,
            tipoRutaPreferida: preferences.tipoRutaPreferida,
            vehiculos: preferences.vehiculos,
            notificaciones: preferences.notificaciones,
            privacidad: preferences.privacidad,
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
      console.error('Error al guardar preferencias:', error);
      this.error = 'No se pudieron guardar las preferencias. Intenta de nuevo más tarde.';
      this.loading = false;
    }
  }

  /**
   * Restaura los valores por defecto
   */
  restoreDefaults(): void {
    this.preferencesForm.setValue({
      unidadMedida: 'km',
      tipoRutaPreferida: 'driving',
      vehiculos: {
        coche: true,
        bicicleta: true,
        moto: false,
        caminar: true
      },
      notificaciones: {
        rutas: true,
        mensajes: true,
        eventos: true
      },
      privacidad: {
        perfilPublico: true,
        mostrarHistorialRutas: false,
        compartirEstadisticas: true
      }
    });
  }
}
