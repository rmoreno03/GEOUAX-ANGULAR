import { Component, HostListener } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-features-layout',
  templateUrl: './features-layout.component.html',
  styleUrls: ['./features-layout.component.css']
})
export class FeaturesLayoutComponent {
  sidebarCollapsed = false;
  sidebarMobileOpen = false;
  esMovil = window.innerWidth <= 768;

  @HostListener('window:resize', [])
  onResize() {
    this.esMovil = window.innerWidth <= 768;
    if (!this.esMovil) this.sidebarMobileOpen = false;
  }

  toggleSidebar() {
    if (this.esMovil) {
      this.sidebarMobileOpen = !this.sidebarMobileOpen;
      document.body.classList.toggle('sidebar-open', this.sidebarMobileOpen);
    } else {
      this.sidebarCollapsed = !this.sidebarCollapsed;
      localStorage.setItem('sidebarCollapsed', this.sidebarCollapsed.toString());
    }
  }

  cerrarSidebarMovil() {
    this.sidebarMobileOpen = false;
    document.body.classList.remove('sidebar-open');
  }
}
