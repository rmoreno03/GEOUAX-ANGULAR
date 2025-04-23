import { Component, inject, Input } from '@angular/core';
import { AuthService } from '../../../../auth/services/auth.service';


@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  @Input() collapsed = false;


  constructor(private auth: AuthService) {}

  logout() {
    this.auth.logout();
  }





}
