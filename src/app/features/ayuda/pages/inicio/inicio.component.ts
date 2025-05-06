import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-inicio-ayuda',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css']
})
export class InicioComponent implements OnInit {
  searchTerm: string = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Puedes inicializar datos o realizar operaciones al cargar el componente
  }

  /**
   * Realiza la búsqueda en la ayuda con el término introducido
   */
  searchHelp(): void {
    //TODO: Implementar la lógica de búsqueda en la ayuda
  }

  /**
   * Establece un término de búsqueda predefinido y realiza la búsqueda
   * @param term El término a buscar
   */
  setSearchTerm(term: string): void {
    this.searchTerm = term;
    this.searchHelp();
  }
}
