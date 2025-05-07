import { Component, OnInit, inject } from '@angular/core';
import {
  Firestore,
  collection,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  Timestamp,
  CollectionReference
} from '@angular/fire/firestore';
import { Reporte } from '../../../../models/reporte.model';

@Component({
  selector: 'app-contenido-reportado',
  templateUrl: './contenido-reportado.component.html',
  styleUrls: ['./contenido-reportado.component.css'],
  standalone: false
})
export class ContenidoReportadoComponent implements OnInit {
  firestore = inject(Firestore);
  cargando = true;
  reportes: Reporte[] = [];
  reportesFiltrados: Reporte[] = [];
  reporteActivo?: Reporte;

  // Nuevas propiedades para filtrado y estadísticas
  busqueda = '';
  filtroActual = 'todos';
  reportesHoy = 0;
  reportesPendientes = 0;
  reportesResueltos = 0;

  async ngOnInit(): Promise<void> {
    await this.cargarReportes();
  }

  async cargarReportes(): Promise<void> {
    this.cargando = true;
    const colRef = collection(this.firestore, 'reportes') as CollectionReference;
    const snapshot = await getDocs(colRef);

    // Obtener todos los reportes
    const todosReportes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Reporte[];

    // Filtrar solo los no resueltos para la vista principal
    this.reportes = todosReportes.filter(r => !r.resuelto);

    // Calcular estadísticas
    this.reportesResueltos = todosReportes.filter(r => r.resuelto).length;
    this.reportesPendientes = this.reportes.length;

    // Calcular reportes de hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    this.reportesHoy = todosReportes.filter(r => {
      if (!r.fechaEnvio) return false;
      const fechaReporte = r.fechaEnvio.toDate();
      return fechaReporte >= hoy;
    }).length;

    // Aplicar filtros iniciales
    this.aplicarFiltros();
    this.cargando = false;
  }

  formatFecha(fecha?: Timestamp | Date | string): string {
    if (!fecha) return 'Fecha no disponible';

    const date =
      fecha instanceof Date
        ? fecha
        : typeof fecha === 'string'
        ? new Date(fecha)
        : (fecha as Timestamp).toDate?.() ?? new Date();

    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  verContenido(reporte: Reporte): void {
    this.reporteActivo = reporte;
  }

  cerrarModal(): void {
    this.reporteActivo = undefined;
  }

  async eliminarContenido(reporte: Reporte): Promise<void> {
    if (confirm('¿Estás seguro de que deseas eliminar este contenido? Esta acción no se puede deshacer.')) {
      await deleteDoc(doc(this.firestore, 'reportes', reporte.id));
      this.reportes = this.reportes.filter(r => r.id !== reporte.id);
      this.aplicarFiltros();
      if (this.reporteActivo?.id === reporte.id) {
        this.cerrarModal();
      }
    }
  }

  async resolverReporte(reporte: Reporte): Promise<void> {
    await updateDoc(doc(this.firestore, 'reportes', reporte.id), {
      resuelto: true
    });
    this.reportes = this.reportes.filter(r => r.id !== reporte.id);
    this.aplicarFiltros();
    if (this.reporteActivo?.id === reporte.id) {
      this.cerrarModal();
    }
  }

  // Nuevos métodos para filtrado
  setFiltro(filtro: string): void {
    this.filtroActual = filtro;
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    // Primero filtramos por tipo
    let resultados = this.reportes;

    if (this.filtroActual !== 'todos') {
      resultados = resultados.filter(r => r.tipo === this.filtroActual);
    }

    // Luego aplicamos la búsqueda por texto
    if (this.busqueda.trim() !== '') {
      const termino = this.busqueda.toLowerCase().trim();
      resultados = resultados.filter(r =>
        (r.nombre?.toLowerCase().includes(termino) || false) ||
        (r.email?.toLowerCase().includes(termino) || false) ||
        (r.asunto?.toLowerCase().includes(termino) || false) ||
        (r.mensaje?.toLowerCase().includes(termino) || false) ||
        (r.contenidoId?.toLowerCase().includes(termino) || false) ||
        (r.usuarioReportante?.toLowerCase().includes(termino) || false) ||
        (r.usuarioReportado?.toLowerCase().includes(termino) || false) ||
        (r.motivo?.toLowerCase().includes(termino) || false)
      );
    }

    this.reportesFiltrados = resultados;
  }

  recargarReportes(): void {
    this.cargarReportes();
  }
}
