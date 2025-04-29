// features-layout.component.ts

import { Component, HostListener, OnInit } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-features-layout',
  templateUrl: './features-layout.component.html',
  styleUrls: ['./features-layout.component.css']
})
export class FeaturesLayoutComponent implements OnInit {
  // Estados del sidebar
  sidebarCollapsed = false;     // Para desktop
  sidebarMobileOpen = false;    // Para móvil

  // Estado del topbar en móvil
  topbarMobileOpen = true;      // Inicialmente visible

  // Detección de dispositivo
  esMovil = false;

  ngOnInit() {
    // Recuperar estado del sidebar si estaba guardado
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState) {
      this.sidebarCollapsed = savedState === 'true';
    }

    // Comprobar tamaño de pantalla inicial
    this.checkScreenSize();
  }

  // Detectar cambios en el tamaño de pantalla
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  // Comprobar si estamos en móvil
  checkScreenSize() {
    const prevEsMovil = this.esMovil;
    this.esMovil = window.innerWidth <= 1024;

    // Si cambiamos de móvil a desktop, resetear estados móviles
    if (prevEsMovil && !this.esMovil) {
      this.sidebarMobileOpen = false;
      this.topbarMobileOpen = true;
      document.body.style.overflow = '';
    }
  }

  // Toggle sidebar (comportamiento diferente según dispositivo)
  toggleSidebar() {
    if (this.esMovil) {
      this.toggleSidebarMobile();
    } else {
      this.sidebarCollapsed = !this.sidebarCollapsed;
      localStorage.setItem('sidebarCollapsed', this.sidebarCollapsed.toString());
    }
  }

  // Toggle sidebar específico para móvil
  toggleSidebarMobile() {
    this.sidebarMobileOpen = !this.sidebarMobileOpen;
    // Prevenir scroll del body cuando sidebar está abierto
    document.body.style.overflow = this.sidebarMobileOpen ? 'hidden' : '';
  }

  // Toggle topbar específico para móvil
  toggleTopbarMobile() {
    this.topbarMobileOpen = !this.topbarMobileOpen;
  }

  // Cerrar sidebar móvil
  cerrarSidebarMovil() {
    this.sidebarMobileOpen = false;
    document.body.style.overflow = '';
  }
}
