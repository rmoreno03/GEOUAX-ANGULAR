import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TutorialesService } from '../../services/tutoriales.service';
import { Tutorial } from '../../../../models/tutorial.model';

@Component({
  standalone: false,
  selector: 'app-tutoriales',
  templateUrl: './tutoriales.component.html',
  styleUrls: ['./tutoriales.component.css']
})
export class TutorialesComponent implements OnInit {
  // Variables para búsqueda y filtrado
  searchTerm: string = '';
  selectedCategory: string = 'todos';
  tutoriales: Tutorial[] = [];
  filteredTutoriales: Tutorial[] = [];
  popularTutoriales: Tutorial[] = [];

  // Variables para paginación
  currentPage: number = 1;
  tutorialesPorPagina: number = 9;
  totalPages: number = 1;

  // Variables de estado
  loading: boolean = true;
  emailNewsletter: string = '';
  tutorialSeleccionado: Tutorial | null = null;

  constructor(
    private tutorialesService: TutorialesService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.cargarTutoriales();
  }

  /**
   * Carga los tutoriales desde el servicio
   */
  cargarTutoriales(): void {
    this.loading = true;

    this.tutorialesService.getTutoriales().subscribe(
      (data) => {
        this.tutoriales = data;
        this.filteredTutoriales = [...this.tutoriales];
        this.calcularTotalPaginas();
        this.cargarPopulares();
        this.loading = false;
      },
      (error) => {
        console.error('Error al cargar tutoriales:', error);
        this.loading = false;
      }
    );
  }

  /**
   * Carga los tutoriales más populares
   */
  cargarPopulares(): void {
    // Simulación: ordenar por visitas y seleccionar los 3 primeros
    this.popularTutoriales = [...this.tutoriales]
      .sort((a, b) => (b.visitas || 0) - (a.visitas || 0))
      .slice(0, 3);
  }

  /**
   * Filtra los tutoriales según el término de búsqueda
   */
  filterTutoriales(): void {
    if (!this.searchTerm.trim() && this.selectedCategory === 'todos') {
      this.filteredTutoriales = [...this.tutoriales];
    } else {
      this.filteredTutoriales = this.tutoriales.filter(tutorial => {
        const matchesSearch = !this.searchTerm.trim() ||
          tutorial.titulo.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          tutorial.descripcion.toLowerCase().includes(this.searchTerm.toLowerCase());

        const matchesCategory = this.selectedCategory === 'todos' ||
          tutorial.categoria.toLowerCase() === this.selectedCategory.toLowerCase();

        return matchesSearch && matchesCategory;
      });
    }

    this.currentPage = 1;
    this.calcularTotalPaginas();
  }

  /**
   * Filtra por categoría
   * @param category Categoría seleccionada
   */
  filterByCategory(category: string): void {
    this.selectedCategory = category;
    this.filterTutoriales();
  }

  /**
   * Calcula el total de páginas para la paginación
   */
  calcularTotalPaginas(): void {
    this.totalPages = Math.ceil(this.filteredTutoriales.length / this.tutorialesPorPagina);
  }

  /**
   * Cambia la página actual
   * @param page Número de página
   */
  cambiarPagina(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      // Implementar lógica para mostrar tutoriales paginados
    }
  }

  /**
   * Resetea los filtros y muestra todos los tutoriales
   */
  resetFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = 'todos';
    this.filteredTutoriales = [...this.tutoriales];
    this.currentPage = 1;
    this.calcularTotalPaginas();
  }

  /**
   * Abre el tutorial seleccionado
   * @param tutorialId ID del tutorial
   */
  verTutorial(tutorialId: string): void {
    const tutorial = this.tutoriales.find(t => t.id === tutorialId);
    if (tutorial) {
      this.tutorialSeleccionado = tutorial;

      // Si el tutorial se abre, incrementar contador de visitas
      this.tutorialesService.incrementarVisitas(tutorialId).subscribe(() => {
        // Actualizar contador local
        if (tutorial.visitas !== undefined) {
          tutorial.visitas += 1;
        } else {
          tutorial.visitas = 1;
        }
      });
    }
  }

  /**
   * Cierra el modal del tutorial
   */
  cerrarModal(): void {
    this.tutorialSeleccionado = null;
  }

  /**
   * Sanitiza la URL del video para que Angular la considere segura
   * @param videoUrl URL del video
   * @returns URL sanitizada
   */
  sanitizeVideoUrl(videoUrl: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(videoUrl);
  }

  /**
   * Inicia la descarga del PDF del tutorial
   */
  descargarPDF(): void {
    if (this.tutorialSeleccionado) {
      this.tutorialesService.descargarPDF(this.tutorialSeleccionado.id).subscribe(
        (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `tutorial-${this.tutorialSeleccionado?.titulo.toLowerCase().replace(/\s+/g, '-')}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        },
        (error) => {
          console.error('Error al descargar PDF:', error);
          // Mostrar mensaje de error
        }
      );
    }
  }

  /**
   * Suscribe al usuario al newsletter
   */
  suscribirNewsletter(): void {
    if (this.emailNewsletter && this.validarEmail(this.emailNewsletter)) {
      this.tutorialesService.suscribirNewsletter(this.emailNewsletter).subscribe(
        () => {
          // Mostrar mensaje de éxito
          alert('¡Te has suscrito correctamente al newsletter!');
          this.emailNewsletter = '';
        },
        (error) => {
          console.error('Error al suscribir:', error);
          // Mostrar mensaje de error
        }
      );
    } else {
      // Mostrar mensaje de error de validación
      alert('Por favor, introduce un email válido');
    }
  }

  /**
   * Valida el formato del email
   * @param email Email a validar
   * @returns true si el email es válido
   */
  private validarEmail(email: string): boolean {
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return regex.test(email);
  }
}
