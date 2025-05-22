import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Firestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp
} from '@angular/fire/firestore';
import { Usuario } from '../../../../models/usuario.model';

export interface Activity {
  id: string;
  type: 'login' | 'route_created' | 'route_completed' | 'profile_updated' | 'friend_added';
  title: string;
  description: string;
  timestamp: Timestamp;
  userId: string;
}

@Component({
  selector: 'app-user-detail',
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.css'],
  standalone: false
})
export class UserDetailComponent implements OnInit {
  user: Usuario | null = null;
  loading = true;
  error: string | null = null;

  // Actividad reciente
  recentActivities: Activity[] = [];
  loadingActivity = false;

  // Estadísticas
  loadingStats = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firestore: Firestore
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadUser(params['id']);
      }
    });
  }

  async loadUser(userId: string): Promise<void> {
    try {
      this.loading = true;
      this.error = null;

      const userRef = doc(this.firestore, 'usuarios', userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        this.error = 'Usuario no encontrado';
        this.user = null;
      } else {
        const userData = userSnap.data();
        this.user = {
          ...userData,
          uid: userSnap.id
        } as Usuario;

        // Cargar estadísticas de rutas
        await this.loadUserStats();

        // Cargar actividad reciente
        await this.loadRecentActivity();
      }
    } catch (err) {
      console.error('Error al cargar usuario:', err);
      this.error = 'Error al cargar la información del usuario';
    } finally {
      this.loading = false;
    }
  }

  async loadUserStats(): Promise<void> {
    if (!this.user) return;

    try {
      this.loadingStats = true;

      // Cargar estadísticas de rutas
      this.user.totalRutas = await this.contarRutasUsuario(this.user.uid);
      this.user.rutasPublicas = await this.contarRutasPublicasUsuario(this.user.uid);
      this.user.kmRecorridos = await this.calcularKmRecorridos(this.user.uid);

    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      // Asignar valores por defecto si hay error
      this.user.totalRutas = 0;
      this.user.rutasPublicas = 0;
      this.user.kmRecorridos = 0;
    } finally {
      this.loadingStats = false;
    }
  }

  async contarRutasUsuario(usuarioId: string): Promise<number> {
    try {
      const rutasRef = collection(this.firestore, 'rutas');
      const q = query(rutasRef, where('usuarioCreador', '==', usuarioId));
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error al contar rutas:', error);
      return 0;
    }
  }

  async contarRutasPublicasUsuario(usuarioId: string): Promise<number> {
    try {
      const rutasRef = collection(this.firestore, 'rutas');
      const q = query(
        rutasRef,
        where('usuarioCreador', '==', usuarioId),
        where('isPublic', '==', true)
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error al contar rutas públicas:', error);
      return 0;
    }
  }

  async calcularKmRecorridos(usuarioId: string): Promise<number> {
    try {
      const rutasRef = collection(this.firestore, 'rutas');
      const q = query(rutasRef, where('usuarioCreador', '==', usuarioId));
      const snapshot = await getDocs(q);

      let totalKm = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        totalKm += data['distanciaKm'] || 0;
      });

      return Math.round(totalKm);
    } catch (error) {
      console.error('Error al calcular km recorridos:', error);
      return 0;
    }
  }

  async loadRecentActivity(): Promise<void> {
    if (!this.user) return;

    try {
      this.loadingActivity = true;

      const activities: Activity[] = [];

      // Última conexión
      if (this.user.fechaUltimoLogin || this.user.ultimaConexion) {
        activities.push({
          id: '1',
          type: 'login',
          title: 'Inicio de sesión',
          description: 'Última vez que el usuario accedió a la plataforma',
          timestamp: (this.user.fechaUltimoLogin || this.user.ultimaConexion) as Timestamp,
          userId: this.user.uid
        });
      }

      // Últimas rutas creadas
      if (this.user.totalRutas) {
        const rutasRef = collection(this.firestore, 'rutas');
        const q = query(
          rutasRef,
          where('usuarioCreador', '==', this.user.uid),
          orderBy('fechaCreacion', 'desc'),
          limit(3)
        );

        const rutasSnap = await getDocs(q);
        rutasSnap.forEach(doc => {
          const rutaData = doc.data();
          activities.push({
            id: doc.id,
            type: 'route_created',
            title: 'Ruta creada',
            description: `Creó la ruta "${rutaData['nombre'] || 'Sin nombre'}"`,
            timestamp: rutaData['fechaCreacion'] as Timestamp,
            userId: this.user!.uid
          });
        });
      }

      // Ordenar por fecha descendente
      this.recentActivities = activities.sort((a, b) => {
        const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp as any);
        const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp as any);
        return dateB.getTime() - dateA.getTime();
      });

    } catch (err) {
      console.error('Error al cargar actividad reciente:', err);
      this.recentActivities = [];
    } finally {
      this.loadingActivity = false;
    }
  }

  formatFecha(fecha: any): string {
    if (!fecha) return 'No disponible';

    try {
      const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  }

  getProviderIcon(provider: string): string {
    const icons: Record<string, string> = {
      'google': 'fa-google',
      'facebook': 'fa-facebook-f',
      'twitter': 'fa-twitter',
      'email': 'fa-envelope'
    };
    return icons[provider] || 'fa-user';
  }

  getProviderName(provider: string): string {
    const names: Record<string, string> = {
      'google': 'Google',
      'facebook': 'Facebook',
      'twitter': 'Twitter',
      'email': 'Email'
    };
    return names[provider] || 'Desconocido';
  }

  getActivityIcon(type: string): string {
    const icons: Record<string, string> = {
      'login': 'fas fa-sign-in-alt',
      'route_created': 'fas fa-route',
      'route_completed': 'fas fa-check-circle',
      'profile_updated': 'fas fa-user-edit',
      'friend_added': 'fas fa-user-plus'
    };
    return icons[type] || 'fas fa-circle';
  }

  onImageError(event: any): void {
    event.target.src = 'default-avatar.png';
  }

  exportUser(): void {
    if (!this.user) return;

    const userData = {
      ...this.user,
      exportedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `usuario_${this.user.uid}_${new Date().getTime()}.json`;
    link.click();

    URL.revokeObjectURL(url);
  }

  retry(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadUser(params['id']);
      }
    });
  }

  navigateToEdit(): void {
    if (this.user) {
      this.router.navigate(['/admin/usuarios', this.user.uid, 'edit']);
    }
  }
}
