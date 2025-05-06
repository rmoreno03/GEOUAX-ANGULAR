import { Component, OnInit, inject } from '@angular/core';
import { Firestore, collection, getDocs, doc, deleteDoc, updateDoc } from '@angular/fire/firestore';
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-contenido-reportado',
  templateUrl: './contenido-reportado.component.html',
  styleUrls: ['./contenido-reportado.component.css'],
  standalone: false
})
export class ContenidoReportadoComponent implements OnInit {
  firestore = inject(Firestore);
  cargando = true;
  reportes: any[] = [];

  async ngOnInit() {
    const colRef = collection(this.firestore, 'reportes');
    const snapshot = await getDocs(colRef);
    this.reportes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    this.cargando = false;
  }

  formatFecha(fecha: Timestamp | Date | string): string {
    let date: Date;

    if (fecha instanceof Date) {
      date = fecha;
    } else if (typeof fecha === 'string') {
      date = new Date(fecha);
    } else if ((fecha as Timestamp).toDate) {
      date = (fecha as Timestamp).toDate();
    } else {
      return '';
    }

    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  verContenido(reporte: any) {
    // Puedes redirigir a una vista o abrir un modal según el tipo
    console.log('Ver contenido:', reporte);
  }

  async eliminarContenido(reporte: any) {
    // Lógica para eliminar la ruta/punto/comentario asociado
    await deleteDoc(doc(this.firestore, 'reportes', reporte.id));
    this.reportes = this.reportes.filter(r => r.id !== reporte.id);
  }

  async resolverReporte(reporte: any) {
    await updateDoc(doc(this.firestore, 'reportes', reporte.id), {
      resuelto: true
    });
    this.reportes = this.reportes.filter(r => r.id !== reporte.id);
  }
}
