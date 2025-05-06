import { Component, OnInit, OnDestroy } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subscription } from 'rxjs';
import { NotificacionesService, Notificacion } from '../../services/notificaciones.service';

@Component({
  selector: 'app-notificaciones',
  templateUrl: './notificaciones.component.html',
  styleUrls: ['./notificaciones.component.css'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(-20px)' }))
      ])
    ])
  ],
  standalone: false
})
export class NotificacionesComponent implements OnInit, OnDestroy {
  notificaciones: (Notificacion & { id: string })[] = [];
  private subscription: Subscription | null = null;

  constructor(private notificacionesService: NotificacionesService) {}

  ngOnInit(): void {
    this.subscription = this.notificacionesService.notificacion$.subscribe(notif => {
      if (notif.id) {
        // Añadir notificación al array
        this.notificaciones.push(notif as Notificacion & { id: string });

        // Programar la eliminación automática
        const duracion = notif.duracion || 3000;
        setTimeout(() => {
          this.cerrarNotificacion(notif.id!);
        }, duracion);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  cerrarNotificacion(id: string): void {
    this.notificaciones = this.notificaciones.filter(n => n.id !== id);
  }

  getIcono(tipo: string): string {
    switch (tipo) {
      case 'exito': return 'fas fa-check-circle';
      case 'error': return 'fas fa-exclamation-circle';
      case 'info': return 'fas fa-info-circle';
      case 'advertencia': return 'fas fa-exclamation-triangle';
      default: return 'fas fa-bell';
    }
  }
}
