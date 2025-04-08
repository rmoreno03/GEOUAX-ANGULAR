import { Component } from '@angular/core';

@Component({
  selector: 'app-features-layout',
  standalone: false,
  templateUrl: './features-layout.component.html',
  styleUrl: './features-layout.component.css'
})
export class FeaturesLayoutComponent {

  sidebarCollapsed = false;

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

}
