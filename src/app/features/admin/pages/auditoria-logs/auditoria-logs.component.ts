import { Component, OnInit, inject } from '@angular/core';
import {
  Firestore,
  Timestamp,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  startAfter,
  QueryDocumentSnapshot,
  where
} from '@angular/fire/firestore';

interface LogEntry {
  id?: string;
  usuario: string;
  usuarioNombre?: string;
  accion: string;
  tipo: 'info' | 'warning' | 'error' | 'success';
  fecha: Timestamp;
  ip?: string;
  browser?: string;
  plataforma?: string;
  detalles?: any;
  entidadId?: string;
  entidadTipo?: 'usuario' | 'ruta' | 'punto' | 'sesion' | 'sistema';
  expanded?: boolean; // Para UI
}

@Component({
  selector: 'app-auditoria-logs',
  templateUrl: './auditoria-logs.component.html',
  styleUrls: ['./auditoria-logs.component.css'],
  standalone: false
})
export class AuditoriaLogsComponent implements OnInit {
  private firestore = inject(Firestore);

  logs: LogEntry[] = [];
  logsFiltrados: LogEntry[] = [];
  cargando = true;

  // Filtros
  filtroTipo = '';
  filtroEntidad = '';
  filtroUsuario = '';

  // Paginación
  lastDoc: QueryDocumentSnapshot | null = null;
  hayMasLogs = true;
  readonly pageSize = 50;

  async ngOnInit() {
    await this.cargarLogs();
  }

  async cargarLogs(cargarMas = false) {
    try {
      if (!cargarMas) {
        this.cargando = true;
        this.logs = [];
        this.lastDoc = null;
      }

      const colRef = collection(this.firestore, 'logs');
      let q = query(
        colRef,
        orderBy('fecha', 'desc'),
        limit(this.pageSize)
      );

      if (cargarMas && this.lastDoc) {
        q = query(q, startAfter(this.lastDoc));
      }

      const snapshot = await getDocs(q);

      const nuevosLogs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<LogEntry, 'id'>),
        expanded: false // Inicializar para UI
      }));

      if (cargarMas) {
        this.logs.push(...nuevosLogs);
      } else {
        this.logs = nuevosLogs;
      }

      this.lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
      this.hayMasLogs = snapshot.docs.length === this.pageSize;

      this.filtrarLogs();
    } catch (error) {
      console.error('Error al cargar logs:', error);
    } finally {
      this.cargando = false;
    }
  }

  filtrarLogs() {
    this.logsFiltrados = this.logs.filter(log => {
      // Filtro por tipo
      if (this.filtroTipo && log.tipo !== this.filtroTipo) {
        return false;
      }

      // Filtro por entidad
      if (this.filtroEntidad && log.entidadTipo !== this.filtroEntidad) {
        return false;
      }

      // Filtro por usuario
      if (this.filtroUsuario) {
        const busqueda = this.filtroUsuario.toLowerCase();
        if (!log.usuario.toLowerCase().includes(busqueda) &&
            (!log.usuarioNombre || !log.usuarioNombre.toLowerCase().includes(busqueda))) {
          return false;
        }
      }

      return true;
    });
  }

  async cargarMasLogs() {
    await this.cargarLogs(true);
  }

  limpiarFiltros() {
    this.filtroTipo = '';
    this.filtroEntidad = '';
    this.filtroUsuario = '';
    this.filtrarLogs();
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

  getIcono(tipo: string): string {
    const iconos = {
      'success': 'fas fa-check-circle',
      'info': 'fas fa-info-circle',
      'warning': 'fas fa-exclamation-triangle',
      'error': 'fas fa-times-circle'
    };

    return iconos[tipo as keyof typeof iconos] || 'fas fa-circle';
  }

  toggleDetalles(logId: string) {
    const log = this.logsFiltrados.find(l => l.id === logId);
    if (log) {
      log.expanded = !log.expanded;
    }
  }

  formatDetalles(detalles: any): string {
    try {
      return JSON.stringify(detalles, null, 2);
    } catch {
      return detalles.toString();
    }
  }

  trackByFn(index: number, item: LogEntry): string {
    return item.id || index.toString();
  }
}
