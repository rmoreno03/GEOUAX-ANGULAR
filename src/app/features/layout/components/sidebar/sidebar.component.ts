import { Component, Input, OnInit } from '@angular/core';
import { AuthService } from '../../../../auth/services/auth.service';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit {
  @Input() collapsed = false;
  esAdmin = false;

  constructor(
    private authService: AuthService,
    private auth: Auth,
    private firestore: Firestore
  ) {}

  async ngOnInit() {
    const user = this.auth.currentUser;
    if (!user) return;

    const userRef = doc(this.firestore, `usuarios/${user.uid}`);
    const userSnap = await getDoc(userRef);
    const data = userSnap.data();

    this.esAdmin = data?.['rol'] === 'admin';
  }

  logout() {
    this.authService.logout();
  }
}
