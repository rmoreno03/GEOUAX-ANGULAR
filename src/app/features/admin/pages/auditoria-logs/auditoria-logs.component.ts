import { Component, OnInit, inject } from '@angular/core';
import { Firestore, Timestamp, collection, getDocs } from '@angular/fire/firestore';
import { LogEntry } from '../../../../models/logEntry.model'; // ajusta la ruta si lo defines aparte

@Component({
  selector: 'app-auditoria-logs',
  templateUrl: './auditoria-logs.component.html',
  styleUrls: ['./auditoria-logs.component.css'],
  standalone: false
})
export class AuditoriaLogsComponent implements OnInit {
  firestore = inject(Firestore);
  logs: LogEntry[] = [];
  cargando = true;

  async ngOnInit() {
    const colRef = collection(this.firestore, 'logs');
    const snapshot = await getDocs(colRef);

    this.logs = snapshot.docs
      .map(doc => ({ id: doc.id, ...(doc.data() as Omit<LogEntry, 'id'>) }))
      .sort((a, b) => b.fecha.seconds - a.fecha.seconds);

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
}
