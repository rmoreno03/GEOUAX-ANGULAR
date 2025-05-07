import { Component, OnInit } from '@angular/core';
import { GuiasService } from '../../services/guias.service';
import { Guia } from '../../../../models/guia.model';

@Component({
  standalone: false,
  selector: 'app-guias-pdf',
  templateUrl: './guias-pdf.component.html',
  styleUrls: ['./guias-pdf.component.css']
})
export class GuiasPdfComponent implements OnInit {
  // Variables para búsqueda y filtrado
  searchTerm = '';
  selectedCategory = 'todas';
  guias: Guia[] = [];
  filteredGuias: Guia[] = [];
  guiasPopulares: Guia[] = [];

  // Variables de estado
  loading = true;
  cargandoPreview = false;
  guiaSeleccionada: Guia | null = null;

  // Variable para solicitud de guía
  solicitudTema = '';
  solicitudEnviada = false;

  constructor(private guiasService: GuiasService) { }

  ngOnInit(): void {
    this.cargarGuias();
  }

  /**
   * Carga las guías PDF desde el servicio
   */
  cargarGuias(): void {
    this.loading = true;

    this.guiasService.getGuias().subscribe(
      (data) => {
        this.guias = data;
        this.filteredGuias = [...this.guias];
        this.cargarGuiasPopulares();
        this.loading = false;
      },
      (error) => {
        console.error('Error al cargar guías:', error);
        this.loading = false;
      }
    );
  }

  /**
   * Carga las guías más populares (con más descargas)
   */
  cargarGuiasPopulares(): void {
    // Ordenar por número de descargas y tomar las 3 primeras
    this.guiasPopulares = [...this.guias]
      .sort((a, b) => (b.descargas || 0) - (a.descargas || 0))
      .slice(0, 3);
  }

  /**
   * Filtra las guías según el término de búsqueda
   */
  filterGuias(): void {
    if (!this.searchTerm.trim() && this.selectedCategory === 'todas') {
      this.filteredGuias = [...this.guias];
    } else {
      this.filteredGuias = this.guias.filter(guia => {
        const matchesSearch = !this.searchTerm.trim() ||
          guia.titulo.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          guia.descripcion.toLowerCase().includes(this.searchTerm.toLowerCase());

        const matchesCategory = this.selectedCategory === 'todas' ||
          guia.categoria.toLowerCase() === this.selectedCategory.toLowerCase();

        return matchesSearch && matchesCategory;
      });
    }
  }

  /**
   * Filtra por categoría
   * @param category Categoría seleccionada
   */
  filterByCategory(category: string): void {
    this.selectedCategory = category;
    this.filterGuias();
  }

  /**
   * Resetea los filtros y muestra todas las guías
   */
  resetFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = 'todas';
    this.filteredGuias = [...this.guias];
  }

  /**
   * Muestra la vista previa de una guía
   * @param guia Guía a previsualizar
   */
  verPreview(guia: Guia): void {
    this.guiaSeleccionada = guia;
    this.cargandoPreview = true;

    // Simular carga de vista previa
    setTimeout(() => {
      this.cargandoPreview = false;

      // Si la guía no tiene páginas de vista previa, registrar el evento
      if (!guia.paginasPreview || guia.paginasPreview.length === 0) {
        console.error('La guía no tiene páginas de vista previa');
      }
    }, 1500);
  }

  /**
   * Cierra el modal de vista previa
   */
  cerrarModal(): void {
    this.guiaSeleccionada = null;
  }

  /**
   * Inicia la descarga de una guía PDF
   * @param guia Guía a descargar
   */
  descargarGuia(guia: Guia): void {
    this.guiasService.descargarGuia(guia.id).subscribe(
      (blob) => {
        // Crear un objeto URL para el blob
        const url = window.URL.createObjectURL(blob);

        // Crear un elemento <a> para la descarga
        const a = document.createElement('a');
        a.href = url;
        a.download = `${guia.titulo.toLowerCase().replace(/\s+/g, '-')}.pdf`;
        document.body.appendChild(a);
        a.click();

        // Limpiar
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Incrementar el contador de descargas
        this.incrementarDescargas(guia);
      },
      (error) => {
        console.error('Error al descargar la guía:', error);
        // Aquí se podría mostrar un mensaje de error
      }
    );
  }

  /**
   * Incrementa el contador de descargas de una guía
   * @param guia Guía descargada
   */
  private incrementarDescargas(guia: Guia): void {
    this.guiasService.incrementarDescargas(guia.id).subscribe(() => {
      // Actualizar el contador local
      if (guia.descargas !== undefined) {
        guia.descargas++;
      } else {
        guia.descargas = 1;
      }

      // Actualizar las guías populares si es necesario
      this.cargarGuiasPopulares();
    });
  }

  /**
   * Envía una solicitud de nueva guía
   */
  solicitarGuia(): void {
    if (!this.solicitudTema.trim()) {
      return;
    }

    this.guiasService.solicitarGuia(this.solicitudTema).subscribe(
      () => {
        this.solicitudEnviada = true;
        // Resetear después de 5 segundos
        setTimeout(() => {
          this.solicitudEnviada = false;
          this.solicitudTema = '';
        }, 5000);
      },
      (error) => {
        console.error('Error al solicitar la guía:', error);
        // Aquí se podría mostrar un mensaje de error
      }
    );
  }
}
