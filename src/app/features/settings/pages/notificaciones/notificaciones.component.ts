import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

@Component({
  standalone: false,
  selector: 'app-notificaciones',
  templateUrl: './notificaciones.component.html',
  styleUrls: ['./notificaciones.component.css']
})
export class NotificacionesComponent implements OnInit {
  notificacionesForm: FormGroup;
  guardadoExitoso = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private auth: Auth
  ) {
    // Inicializar formulario con valores predeterminados
    this.notificacionesForm = this.fb.group({
      notificacionesPush: [true],
      correoElectronico: [true],
      rutasCercanas: [true],
      mensajes: [true],
      eventos: [true],
      amigos: [true],
      valoraciones: [true],
      sistema: [true],
      metodo: ['todas'],
      silenciar: [false],
      horaInicio: ['22:00'],
      horaFin: ['07:00']
    });
  }

  ngOnInit(): void {
    this.cargarNotificaciones();
  }

  /**
   * Carga la configuración de notificaciones del usuario desde Firestore
   */
  async cargarNotificaciones(): Promise<void> {
    try {
      const userId = this.auth.currentUser?.uid;

      if (!userId) {
        this.error = 'Usuario no autenticado';
        return;
      }

      const docRef = doc(this.firestore, `usuarios/${userId}/configuracion/notificaciones`);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        this.notificacionesForm.patchValue({
          notificacionesPush: data['notificacionesPush'] ?? true,
          correoElectronico: data['correoElectronico'] ?? true,
          rutasCercanas: data['rutasCercanas'] ?? true,
          mensajes: data['mensajes'] ?? true,
          eventos: data['eventos'] ?? true,
          amigos: data['amigos'] ?? true,
          valoraciones: data['valoraciones'] ?? true,
          sistema: data['sistema'] ?? true,
          metodo: data['metodo'] || 'todas',
          silenciar: data['silenciar'] ?? false,
          horaInicio: data['horaInicio'] || '22:00',
          horaFin: data['horaFin'] || '07:00'
        });
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
      this.error = 'Error al cargar la configuración de notificaciones';
    }
  }

  /**
   * Guarda la configuración de notificaciones en Firestore
   */
  async guardarNotificaciones(): Promise<void> {
    try {
      const userId = this.auth.currentUser?.uid;

      if (!userId) {
        this.error = 'Usuario no autenticado';
        return;
      }

      const docRef = doc(this.firestore, `usuarios/${userId}/configuracion/notificaciones`);

      await setDoc(docRef, {
        ...this.notificacionesForm.value,
        ultimaActualizacion: new Date()
      });

      this.guardadoExitoso = true;
      this.error = '';

      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        this.guardadoExitoso = false;
      }, 3000);

    } catch (error) {
      console.error('Error al guardar notificaciones:', error);
      this.error = 'Error al guardar la configuración de notificaciones';
      this.guardadoExitoso = false;
    }
  }

  /**
   * Activa todas las notificaciones
   */
  activarTodas(): void {
    this.notificacionesForm.patchValue({
      rutasCercanas: true,
      mensajes: true,
      eventos: true,
      amigos: true,
      valoraciones: true,
      sistema: true
    });
  }

  /**
   * Desactiva todas las notificaciones
   */
  desactivarTodas(): void {
    this.notificacionesForm.patchValue({
      rutasCercanas: false,
      mensajes: false,
      eventos: false,
      amigos: false,
      valoraciones: false,
      sistema: false
    });
  }

  /**
   * Restaura los valores por defecto
   */
  restaurarDefecto(): void {
    this.notificacionesForm.setValue({
      notificacionesPush: true,
      correoElectronico: true,
      rutasCercanas: true,
      mensajes: true,
      eventos: true,
      amigos: true,
      valoraciones: true,
      sistema: true,
      metodo: 'todas',
      silenciar: false,
      horaInicio: '22:00',
      horaFin: '07:00'
    });
  }
}
