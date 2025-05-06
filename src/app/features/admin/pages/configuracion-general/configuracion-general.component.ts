import { Component, OnInit, inject } from '@angular/core';
import { Firestore, doc, getDoc, updateDoc, DocumentReference } from '@angular/fire/firestore';

@Component({
  selector: 'app-configuracion-general',
  templateUrl: './configuracion-general.component.html',
  styleUrls: ['./configuracion-general.component.css'],
  standalone: false
})
export class ConfiguracionGeneralComponent implements OnInit {
  firestore = inject(Firestore);
  cargando = true;
  guardando = false;

  // Formulario reactivo simple
  config: any = {
    nombreApp: '',
    mantenimiento: false,
    mensajeMantenimiento: '',
    version: '',
    mostrarBanner: false,
    textoBanner: ''
  };

  async ngOnInit() {
    const ref: DocumentReference = doc(this.firestore, 'configuracion', 'general');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      this.config = { ...snap.data() };
    }
    this.cargando = false;
  }

  async guardarCambios() {
    this.guardando = true;
    const ref: DocumentReference = doc(this.firestore, 'configuracion', 'general');
    await updateDoc(ref, this.config);
    this.guardando = false;
  }
}
