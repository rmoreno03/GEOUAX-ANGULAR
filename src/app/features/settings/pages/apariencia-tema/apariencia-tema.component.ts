import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

@Component({
  standalone: false,
  selector: 'app-apariencia-tema',
  templateUrl: './apariencia-tema.component.html',
  styleUrls: ['./apariencia-tema.component.css']
})
export class AparienciaTemaComponent implements OnInit {
  aparienciaForm: FormGroup;
  guardadoExitoso = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private auth: Auth
  ) {
    // Inicializar formulario con valores predeterminados
    this.aparienciaForm = this.fb.group({
      tema: ['claro'],
      colorPrimario: ['naranja'],
      animaciones: [true],
      contrasteAlto: [false],
      escalaTipografia: [false]
    });
  }

  ngOnInit(): void {
    this.cargarApariencia();

    // Detectar el tema del sistema si está en modo "sistema"
    this.detectarTemaDelSistema();
  }

  /**
   * Carga la configuración de apariencia del usuario desde Firestore
   */
  async cargarApariencia(): Promise<void> {
    try {
      const userId = this.auth.currentUser?.uid;

      if (!userId) {
        this.error = 'Usuario no autenticado';
        return;
      }

      const docRef = doc(this.firestore, `usuarios/${userId}/configuracion/apariencia`);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        this.aparienciaForm.patchValue({
          tema: data['tema'] || 'claro',
          colorPrimario: data['colorPrimario'] || 'naranja',
          animaciones: data['animaciones'] ?? true,
          contrasteAlto: data['contrasteAlto'] ?? false,
          escalaTipografia: data['escalaTipografia'] ?? false
        });

        // Aplicar el tema actual
        this.aplicarTema();
      }
    } catch (error) {
      console.error('Error al cargar apariencia:', error);
      this.error = 'Error al cargar la configuración de apariencia';
    }
  }

  /**
   * Guarda la configuración de apariencia en Firestore
   */
  async guardarApariencia(): Promise<void> {
    try {
      const userId = this.auth.currentUser?.uid;

      if (!userId) {
        this.error = 'Usuario no autenticado';
        return;
      }

      const docRef = doc(this.firestore, `usuarios/${userId}/configuracion/apariencia`);

      await setDoc(docRef, {
        ...this.aparienciaForm.value,
        ultimaActualizacion: new Date()
      });

      // Aplicar el tema actualizado
      this.aplicarTema();

      this.guardadoExitoso = true;
      setTimeout(() => {
        this.guardadoExitoso = false;
      }, 3000);

    } catch (error) {
      console.error('Error al guardar apariencia:', error);
      this.error = 'Error al guardar la configuración de apariencia';
    }
  }

  /**
   * Restaura los valores por defecto
   */
  restaurarDefecto(): void {
    this.aparienciaForm.setValue({
      tema: 'claro',
      colorPrimario: 'naranja',
      animaciones: true,
      contrasteAlto: false,
      escalaTipografia: false
    });

    // Aplicar tema por defecto
    this.aplicarTema();
  }

  /**
   * Aplica el tema seleccionado al documento HTML
   */
  private aplicarTema(): void {
    const tema = this.aparienciaForm.get('tema')?.value;
    const colorPrimario = this.aparienciaForm.get('colorPrimario')?.value;
    const contrasteAlto = this.aparienciaForm.get('contrasteAlto')?.value;
    const escalaTipografia = this.aparienciaForm.get('escalaTipografia')?.value;

    const documentElement = document.documentElement;

    // Aplicar tema claro/oscuro
    if (tema === 'oscuro') {
      documentElement.classList.add('dark-theme');
      documentElement.classList.remove('light-theme');
    } else if (tema === 'claro') {
      documentElement.classList.add('light-theme');
      documentElement.classList.remove('dark-theme');
    } else if (tema === 'sistema') {
      this.aplicarTemaDelSistema();
    }

    // Aplicar color primario
    documentElement.setAttribute('data-primary-color', colorPrimario);

    // Aplicar contraste alto
    if (contrasteAlto) {
      documentElement.classList.add('high-contrast');
    } else {
      documentElement.classList.remove('high-contrast');
    }

    // Aplicar escala de tipografía
    if (escalaTipografia) {
      documentElement.classList.add('large-text');
    } else {
      documentElement.classList.remove('large-text');
    }
  }

  /**
   * Detecta el tema del sistema (claro/oscuro)
   */
  private detectarTemaDelSistema(): void {
    // Comprobar si el navegador soporta la detección de tema
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      // Aplicar tema inicial
      if (this.aparienciaForm.get('tema')?.value === 'sistema') {
        this.aplicarTemaDelSistema();
      }

      // Escuchar cambios en el tema del sistema
      mediaQuery.addEventListener('change', () => {
        if (this.aparienciaForm.get('tema')?.value === 'sistema') {
          this.aplicarTemaDelSistema();
        }
      });
    }
  }

  /**
   * Aplica el tema del sistema
   */
  private aplicarTemaDelSistema(): void {
    const documentElement = document.documentElement;
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (isDarkMode) {
      documentElement.classList.add('dark-theme');
      documentElement.classList.remove('light-theme');
    } else {
      documentElement.classList.add('light-theme');
      documentElement.classList.remove('dark-theme');
    }
  }
}
