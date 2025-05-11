import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  Firestore,
  Timestamp
} from '@angular/fire/firestore';
import { AuthService } from '../../../../auth/services/auth.service';
import { AuditLogService } from '../../../../core/services/audit-log.service';
import { UserManagementService } from '../../services/user-management.service';
import {
  UserStatisticsService,
  EstadisticasUsuario,
  Actividad,
  PeriodoTiempo
} from '../../services/user-statistics.service';
import { Subscription } from 'rxjs';
import { Usuario } from '../../../../models/usuario.model';

// Tipo extendido para mostrar en la interfaz
interface UsuarioExtendido extends Usuario {
  id: string; // Para compatibilidad con el HTML
}

@Component({
  standalone: false,
  selector: 'app-estadisticas-usuario',
  templateUrl: './estadisticas-usuario.component.html',
  styleUrls: ['./estadisticas-usuario.component.css']
})
export class EstadisticasUsuarioComponent implements OnInit, OnDestroy {
  loading = false;
  error = '';
  usuarioSeleccionado: UsuarioExtendido | null = null;
  periodoSeleccionado: PeriodoTiempo = 'mensual';
  usuarioBusqueda = '';

  // Lista de usuarios
  usuarios: UsuarioExtendido[] = [];

  // Datos de estadísticas
  estadisticasUsuario: EstadisticasUsuario = {
    totalRutas: 0,
    totalPuntos: 0,
    totalKilometros: 0,
    mediaKilometros: 0,
    tiempoTotal: '0h 0m',
    mediaVelocidad: '0 km/h',
    altitudMaxima: 0,
    desnivelAcumulado: 0,
    rutaMasLarga: {
      nombre: 'Sin rutas',
      distancia: 0,
      fecha: new Date()
    },
    puntosInteres: [],
    actividadMensual: [],
    distribucionTipos: [],
    logrosConseguidos: 0,
    totalLogros: 0,
    retosCompletados: 0,
    retosActivos: 0
  };

  // Actividad reciente
  actividadReciente: Actividad[] = [];

  // Suscripciones para evitar memory leaks
  private suscripciones: Subscription[] = [];

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private auditLog: AuditLogService,
    private userService: UserManagementService,
    private statsService: UserStatisticsService,
    private route: ActivatedRoute,
    private ngZone: NgZone // Para evitar problemas con detección de cambios
  ) {}

  ngOnInit(): void {
    // Verificar si hay un ID de usuario en la URL
    this.suscripciones.push(
      this.route.params.subscribe(params => {
        if (params['id']) {
          this.cargarUsuarioPorId(params['id']);
        } else {
          this.cargarUsuarios();
        }
      })
    );
  }

  ngOnDestroy(): void {
    // Cancelar suscripciones para evitar memory leaks
    this.suscripciones.forEach(sub => sub.unsubscribe());
  }

  async cargarUsuarios(): Promise<void> {
    try {
      this.loading = true;
      this.error = ''; // Limpiar errores anteriores

      // Cargar usuarios mediante el servicio de gestión de usuarios
      const usuariosData = await this.userService.getUsers();

      // Transformar a UsuarioExtendido en la zona de Angular para detección de cambios
      this.ngZone.run(() => {
        this.usuarios = usuariosData.map(usuario => ({
          ...usuario,
          id: usuario.uid // Para compatibilidad con el template
        }));

        // Si hay usuarios, seleccionar el primero por defecto
        if (this.usuarios.length > 0) {
          this.seleccionarUsuario(this.usuarios[0]);
        }
      });

      // Log de carga de usuarios (fuera de ngZone, no afecta la UI)
      await this.auditLog.log(
        'Carga de lista de usuarios para estadísticas',
        'info',
        { cantidad: this.usuarios.length },
        null, // null en vez de undefined
        'sistema'
      );

    } catch (error) {
      console.error('Error al cargar usuarios:', error);

      // Actualizar la UI dentro de ngZone
      this.ngZone.run(() => {
        this.error = 'Error al cargar la lista de usuarios. Inténtalo de nuevo.';
      });

      // Log de error
      await this.auditLog.logError('Error al cargar usuarios para estadísticas', error, 'cargarUsuarios');
    } finally {
      // Actualizar la UI dentro de ngZone
      this.ngZone.run(() => {
        this.loading = false;
      });
    }
  }

  async cargarUsuarioPorId(userId: string): Promise<void> {
    try {
      this.loading = true;
      this.error = ''; // Limpiar errores anteriores

      // Obtener el usuario específico
      const usuario = await this.userService.getUserById(userId);

      if (usuario) {
        // Convertir a UsuarioExtendido y seleccionar en ngZone
        this.ngZone.run(() => {
          const usuarioExtendido: UsuarioExtendido = {
            ...usuario,
            id: usuario.uid
          };

          this.usuarioSeleccionado = usuarioExtendido;
        });

        // Cargar estadísticas y actividad
        await this.cargarEstadisticasYActividad(userId);

        // Cargar la lista de usuarios para el selector
        await this.cargarUsuarios();
      } else {
        this.ngZone.run(() => {
          this.error = 'Usuario no encontrado';
        });

        // Cargar la lista de todos modos
        await this.cargarUsuarios();
      }

    } catch (error) {
      console.error('Error al cargar usuario por ID:', error);

      this.ngZone.run(() => {
        this.error = 'Error al cargar usuario. Inténtalo de nuevo.';
      });

      // Log de error
      await this.auditLog.logError('Error al cargar usuario por ID para estadísticas', error, 'cargarUsuarioPorId');

      // Intentar cargar todos los usuarios de todos modos
      await this.cargarUsuarios();
    } finally {
      this.ngZone.run(() => {
        this.loading = false;
      });
    }
  }

  // Método auxiliar para cargar estadísticas y actividad
  private async cargarEstadisticasYActividad(userId: string): Promise<void> {
    try {
      // Usar el servicio para obtener las estadísticas
      const estadisticas = await this.statsService.getUserStatistics(
        userId,
        this.periodoSeleccionado
      );

      // Usar el servicio para obtener la actividad reciente
      const actividad = await this.statsService.getUserActivity(userId, 5);

      // Actualizar la UI en la zona de Angular
      this.ngZone.run(() => {
        this.estadisticasUsuario = estadisticas;
        this.actividadReciente = actividad;
      });
    } catch (error) {
      console.error('Error al cargar estadísticas y actividad:', error);
      await this.auditLog.logError('Error al cargar estadísticas y actividad', error, 'cargarEstadisticasYActividad');

      // Mostrar error en la UI
      this.ngZone.run(() => {
        this.error = 'Error al cargar estadísticas. Inténtalo de nuevo.';
      });
    }
  }

  filtrarUsuarios(): UsuarioExtendido[] {
    if (!this.usuarioBusqueda) return this.usuarios;

    const filtro = this.usuarioBusqueda.toLowerCase();
    return this.usuarios.filter(usuario =>
      (usuario.nombre || '').toLowerCase().includes(filtro) ||
      usuario.email.toLowerCase().includes(filtro)
    );
  }

  async seleccionarUsuario(usuario: UsuarioExtendido): Promise<void> {
    try {
      this.loading = true;
      this.error = ''; // Limpiar errores anteriores

      // Actualizar usuario seleccionado inmediatamente
      this.ngZone.run(() => {
        this.usuarioSeleccionado = usuario;
      });

      // Log de selección de usuario
      await this.auditLog.log(
        'Consulta de estadísticas de usuario',
        'info',
        {
          userId: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email
        },
        usuario.id || null, // null en vez de undefined
        'usuario'
      );

      // Cargar estadísticas y actividad
      await this.cargarEstadisticasYActividad(usuario.id);

    } catch (error) {
      console.error('Error al seleccionar usuario:', error);

      this.ngZone.run(() => {
        this.error = 'Error al seleccionar usuario. Inténtalo de nuevo.';
      });

      // Log de error
      await this.auditLog.logError('Error al seleccionar usuario para estadísticas', error, 'seleccionarUsuario');
    } finally {
      this.ngZone.run(() => {
        this.loading = false;
      });
    }
  }

  async cambiarPeriodo(periodo: string): Promise<void> {
    try {
      this.loading = true;
      this.error = ''; // Limpiar errores anteriores

      // Actualizar el período inmediatamente
      this.ngZone.run(() => {
        this.periodoSeleccionado = periodo as PeriodoTiempo;
      });

      // Si hay usuario seleccionado, recargar estadísticas
      if (this.usuarioSeleccionado) {
        // Log de cambio de período
        await this.auditLog.log(
          'Cambio de período en estadísticas',
          'info',
          {
            periodo,
            userId: this.usuarioSeleccionado.id
          },
          this.usuarioSeleccionado.id || null, // null en vez de undefined
          'usuario'
        );

        // Obtener estadísticas actualizadas
        const estadisticas = await this.statsService.getUserStatistics(
          this.usuarioSeleccionado.id,
          this.periodoSeleccionado
        );

        // Actualizar la UI
        this.ngZone.run(() => {
          this.estadisticasUsuario = estadisticas;
        });
      }

    } catch (error) {
      console.error('Error al cambiar período:', error);

      this.ngZone.run(() => {
        this.error = 'Error al cambiar período. Inténtalo de nuevo.';
      });

      // Log de error
      await this.auditLog.logError('Error al cambiar período', error, 'cambiarPeriodo');
    } finally {
      this.ngZone.run(() => {
        this.loading = false;
      });
    }
  }

  async exportarEstadisticas(): Promise<void> {
    if (!this.usuarioSeleccionado) return;

    try {
      this.loading = true;
      this.error = ''; // Limpiar errores anteriores

      // Usar el servicio para exportar estadísticas
      const csvContent = await this.statsService.exportUserStatistics(
        this.usuarioSeleccionado.id,
        this.periodoSeleccionado
      );

      // Crear archivo y descargarlo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download',
        `estadisticas_${this.usuarioSeleccionado.nombre || 'usuario'}_${new Date().toISOString().split('T')[0]}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Log de exportación
      await this.auditLog.log(
        'Exportación de estadísticas de usuario',
        'info',
        {
          userId: this.usuarioSeleccionado.id,
          nombre: this.usuarioSeleccionado.nombre,
          email: this.usuarioSeleccionado.email,
          periodo: this.periodoSeleccionado
        },
        this.usuarioSeleccionado.id || null, // null en vez de undefined
        'usuario'
      );

    } catch (error) {
      console.error('Error al exportar estadísticas:', error);

      this.ngZone.run(() => {
        this.error = 'Error al exportar estadísticas. Inténtalo de nuevo.';
      });

      // Log de error
      await this.auditLog.logError('Error al exportar estadísticas', error, 'exportarEstadisticas');
    } finally {
      this.ngZone.run(() => {
        this.loading = false;
      });
    }
  }

  // Utilidades
  formatFecha(fecha: any): string {
    if (!fecha) return 'N/A';

    try {
      // Convertir Timestamp de Firestore a Date si es necesario
      const date = fecha instanceof Timestamp ? fecha.toDate() : new Date(fecha);

      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Fecha inválida';
    }
  }

  formatearFechaRelativa(fecha: any): string {
    try {
      // Convertir Timestamp de Firestore a Date si es necesario
      const fechaObj = fecha instanceof Timestamp ? fecha.toDate() : new Date(fecha);

      const ahora = new Date();
      const dias = Math.floor((ahora.getTime() - fechaObj.getTime()) / (1000 * 3600 * 24));

      if (dias === 0) return 'Hoy';
      if (dias === 1) return 'Ayer';
      if (dias < 7) return `Hace ${dias} días`;
      if (dias < 30) return `Hace ${Math.floor(dias / 7)} semanas`;
      return `Hace ${Math.floor(dias / 30)} meses`;
    } catch (error) {
      console.error('Error al formatear fecha relativa:', error);
      return 'Fecha desconocida';
    }
  }

  getColorProgreso(valor: number): string {
    if (valor >= 75) return 'high';
    if (valor >= 40) return 'medium';
    return 'low';
  }

  // Estas funciones son necesarias para compatibilidad con el HTML
  obtenerUbicacion(latitud?: number, longitud?: number): string {
    if (!latitud || !longitud) return 'Ubicación desconocida';
    return `${latitud.toFixed(3)}°, ${longitud.toFixed(3)}°`;
  }

  capitalizarPrimeraLetra(texto: string): string {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }
}
