import { Component, OnInit } from '@angular/core';
import { PreguntasFrecuentesService } from '../../services/preguntas-frecuentes.service';
import { PreguntaFrecuente } from '../../../../models/pregunta-frecuente.model';

@Component({
  standalone: false,
  selector: 'app-preguntas-frecuentes',
  templateUrl: './preguntas-frecuentes.component.html',
  styleUrls: ['./preguntas-frecuentes.component.css']
})
export class PreguntasFrecuentesComponent implements OnInit {
  // Variables para búsqueda y filtrado
  searchTerm: string = '';
  selectedCategory: string = 'todas';
  preguntas: PreguntaFrecuente[] = [];
  filteredPreguntas: PreguntaFrecuente[] = [];
  preguntasPopulares: PreguntaFrecuente[] = [];

  // Variables de estado
  loading: boolean = true;

  constructor(private preguntasService: PreguntasFrecuentesService) { }

  ngOnInit(): void {
    this.cargarPreguntas();
  }

  /**
   * Carga las preguntas frecuentes desde el servicio
   */
  cargarPreguntas(): void {
    this.loading = true;

    this.preguntasService.getPreguntas().subscribe(
      (data) => {
        this.preguntas = data.map(pregunta => ({
          ...pregunta,
          expanded: false, // Añadir propiedad para expandir/colapsar
          util: null // Añadir propiedad para marcar como útil/no útil
        }));

        this.filteredPreguntas = [...this.preguntas];
        this.cargarPreguntasPopulares();
        this.loading = false;
      },
      (error) => {
        console.error('Error al cargar preguntas frecuentes:', error);
        this.loading = false;
      }
    );
  }

  /**
   * Carga las preguntas más populares basadas en visitas
   */
  cargarPreguntasPopulares(): void {
    // Ordenar por número de visitas y tomar las 3 primeras
    this.preguntasPopulares = [...this.preguntas]
      .sort((a, b) => (b.visitas || 0) - (a.visitas || 0))
      .slice(0, 3);
  }

  /**
   * Filtra las preguntas según el término de búsqueda
   */
  filterPreguntas(): void {
    if (!this.searchTerm.trim() && this.selectedCategory === 'todas') {
      this.filteredPreguntas = [...this.preguntas];
    } else {
      this.filteredPreguntas = this.preguntas.filter(pregunta => {
        const matchesSearch = !this.searchTerm.trim() ||
          pregunta.pregunta.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          pregunta.respuesta.toLowerCase().includes(this.searchTerm.toLowerCase());

        const matchesCategory = this.selectedCategory === 'todas' ||
          pregunta.categoria.toLowerCase() === this.selectedCategory.toLowerCase();

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
    this.filterPreguntas();
  }

  /**
   * Resetea los filtros y muestra todas las preguntas
   */
  resetFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = 'todas';
    this.filteredPreguntas = [...this.preguntas];
  }

  /**
   * Expande o colapsa una pregunta
   * @param index Índice de la pregunta en la lista filtrada
   */
  togglePregunta(index: number): void {
    // Si la pregunta estaba contraída, incrementar contador de visitas
    if (!this.filteredPreguntas[index].expanded) {
      const preguntaId = this.filteredPreguntas[index].id;

      this.preguntasService.incrementarVisitas(preguntaId).subscribe(() => {
        // Actualizar contador local
        const pregunta = this.preguntas.find(p => p.id === preguntaId);
        if (pregunta) {
          if (pregunta.visitas !== undefined) {
            pregunta.visitas += 1;
          } else {
            pregunta.visitas = 1;
          }
        }
      });
    }

    // Toggle del estado expandido
    this.filteredPreguntas[index].expanded = !this.filteredPreguntas[index].expanded;
  }

  /**
   * Marca una pregunta como útil o no útil
   * @param pregunta La pregunta a marcar
   * @param util Valor a asignar (true = útil, false = no útil)
   */
  marcarUtil(pregunta: PreguntaFrecuente, util: boolean): void {
    // Si ya está marcada con el mismo valor, desmarca
    if (pregunta.util === util) {
      pregunta.util = null;
      this.preguntasService.marcarUtilidad(pregunta.id, null).subscribe();
    } else {
      pregunta.util = util;
      this.preguntasService.marcarUtilidad(pregunta.id, util).subscribe();
    }
  }

  /**
   * Navega a una pregunta específica y la expande
   * @param preguntaId ID de la pregunta a mostrar
   */
  irAPregunta(preguntaId: string): void {
    // Resetear los filtros
    this.resetFilters();

    // Encontrar el índice de la pregunta en la lista filtrada
    const index = this.filteredPreguntas.findIndex(p => p.id === preguntaId);

    if (index !== -1) {
      // Colapsar todas las preguntas
      this.filteredPreguntas.forEach(p => p.expanded = false);

      // Expandir la pregunta seleccionada
      this.filteredPreguntas[index].expanded = true;

      // Hacer scroll a la pregunta
      setTimeout(() => {
        const element = document.querySelectorAll('.faq-item')[index];
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }
}
