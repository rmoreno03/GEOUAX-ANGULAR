import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

@Component({
  standalone: false,
  selector: 'app-idioma-region',
  templateUrl: './idioma-region.component.html',
  styleUrls: ['./idioma-region.component.css']
})
export class IdiomaRegionComponent implements OnInit {
  idiomaRegionForm: FormGroup;
  guardadoExitoso = false;
  error = '';

  // Opciones disponibles
  idiomas = [
    { codigo: 'es', nombre: 'Español' },
    { codigo: 'ca', nombre: 'Català' },
    { codigo: 'eu', nombre: 'Euskera' },
    { codigo: 'gl', nombre: 'Gallego' },
    { codigo: 'en', nombre: 'English' },
    { codigo: 'fr', nombre: 'Français' },
    { codigo: 'de', nombre: 'Deutsch' },
    { codigo: 'it', nombre: 'Italiano' },
    { codigo: 'pt', nombre: 'Português' }
  ];

  regiones = [
    { codigo: 'ES', nombre: 'España' },
    { codigo: 'MX', nombre: 'México' },
    { codigo: 'AR', nombre: 'Argentina' },
    { codigo: 'CO', nombre: 'Colombia' },
    { codigo: 'CL', nombre: 'Chile' },
    { codigo: 'US', nombre: 'Estados Unidos' },
    { codigo: 'GB', nombre: 'Reino Unido' },
    { codigo: 'FR', nombre: 'Francia' },
    { codigo: 'DE', nombre: 'Alemania' },
    { codigo: 'IT', nombre: 'Italia' },
    { codigo: 'PT', nombre: 'Portugal' }
  ];

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private auth: Auth
  ) {
    // Inicializar formulario con valores predeterminados
    this.idiomaRegionForm = this.fb.group({
      idioma: ['es'],
      region: ['ES'],
      formatoFecha: ['dd/MM/yyyy'],
      formatoHora: ['24h'],
      unidadMedida: ['km'],
      moneda: ['EUR']
    });
  }

  ngOnInit(): void {
    this.cargarIdiomaRegion();
  }

  /**
   * Carga la configuración de idioma y región del usuario desde Firestore
   */
  async cargarIdiomaRegion(): Promise<void> {
    try {
      const userId = this.auth.currentUser?.uid;

      if (!userId) {
        this.error = 'Usuario no autenticado';
        return;
      }

      const docRef = doc(this.firestore, `usuarios/${userId}/configuracion/idiomaRegion`);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        this.idiomaRegionForm.patchValue({
          idioma: data['idioma'] || 'es',
          region: data['region'] || 'ES',
          formatoFecha: data['formatoFecha'] || 'dd/MM/yyyy',
          formatoHora: data['formatoHora'] || '24h',
          unidadMedida: data['unidadMedida'] || 'km',
          moneda: data['moneda'] || 'EUR'
        });
      }
    } catch (error) {
      console.error('Error al cargar idioma y región:', error);
      this.error = 'Error al cargar la configuración de idioma y región';
    }
  }

  /**
   * Guarda la configuración de idioma y región en Firestore
   */
  async guardarIdioma(): Promise<void> {
    try {
      const userId = this.auth.currentUser?.uid;

      if (!userId) {
        this.error = 'Usuario no autenticado';
        return;
      }

      const docRef = doc(this.firestore, `usuarios/${userId}/configuracion/idiomaRegion`);

      await setDoc(docRef, {
        ...this.idiomaRegionForm.value,
        ultimaActualizacion: new Date()
      });

      this.guardadoExitoso = true;
      setTimeout(() => {
        this.guardadoExitoso = false;
      }, 3000);

    } catch (error) {
      console.error('Error al guardar idioma y región:', error);
      this.error = 'Error al guardar la configuración de idioma y región';
    }
  }

  /**
   * Restaura los valores por defecto
   */
  restaurarDefecto(): void {
    this.idiomaRegionForm.setValue({
      idioma: 'es',
      region: 'ES',
      formatoFecha: 'dd/MM/yyyy',
      formatoHora: '24h',
      unidadMedida: 'km',
      moneda: 'EUR'
    });
  }
}
