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
  searchTerm = '';
  selectedCategory = 'todos';
  tutoriales: Tutorial[] = [];
  filteredTutoriales: Tutorial[] = [];
  popularTutoriales: Tutorial[] = [];
  tutorialSeleccionado: Tutorial | null = null;

  // paginación
  currentPage = 1;
  tutorialesPorPagina = 9;
  totalPages = 1;

  loading = true;
  emailNewsletter = '';

  constructor(
    private tutorialesService: TutorialesService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.cargarTutoriales();
  }

  cargarTutoriales(): void {
    this.loading = true;
    this.tutorialesService.getTutoriales().subscribe(tuts => {
      this.tutoriales = tuts;
      this.filtrar();
      this.loading = false;
    });
  }

  filtrar(): void {
    const termino = this.searchTerm.toLowerCase().trim();
    this.filteredTutoriales = this.tutoriales.filter(t => {
      const matchesSearch = !termino ||
        t.titulo.toLowerCase().includes(termino) ||
        t.descripcion.toLowerCase().includes(termino);
      const matchesCat = this.selectedCategory === 'todos' || t.categoria === this.selectedCategory;
      return matchesSearch && matchesCat;
    });

    this.calcularTotalPaginas();
    this.cargarPopulares();
    this.currentPage = 1;
  }

  filterByCategory(cat: string): void {
    this.selectedCategory = cat;
    this.filtrar();
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPages) {
      this.currentPage = pagina;
    }
  }

  calcularTotalPaginas(): void {
    this.totalPages = Math.ceil(this.filteredTutoriales.length / this.tutorialesPorPagina);
  }

  cargarPopulares(): void {
    this.popularTutoriales = [...this.tutoriales]
      .sort((a, b) => (b.visitas || 0) - (a.visitas || 0))
      .slice(0, 3);
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = 'todos';
    this.filtrar();
  }

  verTutorial(id: string): void {
    const tutorial = this.tutoriales.find(t => t.id === id);
    if (tutorial) {
      this.tutorialSeleccionado = tutorial;
      this.tutorialesService.incrementarVisitas(id).subscribe(() => {
        tutorial.visitas = (tutorial.visitas || 0) + 1;
      });
    }
  }

  cerrarModal(): void {
    this.tutorialSeleccionado = null;
  }

  getEmbedUrl(url: string): string {
    const videoId = url.split('v=')[1]?.split('&')[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
  }


  sanitizeVideoUrl(url: string): SafeResourceUrl {
    const embedUrl = this.getEmbedUrl(url);
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }


  descargarPDF(): void {
    if (!this.tutorialSeleccionado) return;
    this.tutorialesService.descargarPDF(this.tutorialSeleccionado.id).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tutorial-${this.tutorialSeleccionado!.titulo.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    });
  }

  suscribirNewsletter(): void {
    if (!this.validarEmail(this.emailNewsletter)) {
      alert('Introduce un email válido');
      return;
    }

    this.tutorialesService.suscribirNewsletter(this.emailNewsletter).subscribe(() => {
      alert('¡Suscripción exitosa!');
      this.emailNewsletter = '';
    });
  }

  private validarEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  filterTutoriales(): Tutorial[] {
    const startIndex = (this.currentPage - 1) * this.tutorialesPorPagina;
    const endIndex = startIndex + this.tutorialesPorPagina;
    return this.filteredTutoriales.slice(startIndex, endIndex);
  }
}
