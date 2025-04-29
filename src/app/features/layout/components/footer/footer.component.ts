import { Component } from '@angular/core';


@Component({
  selector: 'app-footer',
  standalone: false,
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {

  isInfoPanelOpen = false;

  openInfoPanel() {
    this.isInfoPanelOpen = !this.isInfoPanelOpen;
  }

  closeInfoPanel() {
    this.isInfoPanelOpen = false;
  }

}
