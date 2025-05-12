import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import {
  ImpactoMedioambientalService,
  ImpactoPersonalStats,
  ImpactoGlobalStats,
  EvolucionMensual,
  ProyectoReforestacion,
  ConsejoSostenible
} from '../../services/impacto-medioambiental.service';
import { Ruta } from '../../../../models/ruta.model';
import { AuditLogService } from '../../../../core/services/audit-log.service';

@Component({
  standalone: false,
  selector: 'app-impacto-medioambiental',
  templateUrl: './impacto-medioambiental.component.html',
  styleUrls: ['./impacto-medioambiental.component.css']
})
export class ImpactoMedioambientalComponent implements OnInit, OnDestroy {
  // Estado de carga
  loading = false;
  error = '';

  // Datos de usuario
  rutasUsuario: Ruta[] = [];
  datosPersonales: ImpactoPersonalStats = {
    rutasAlternativas: 0,
    kilometrosAhorro: 0,
    co2Reducido: 0,
    arbolesEquivalentes: 0,
    rutasVerdes: 0,
    calificacionSostenibilidad: 'E'
  };

  // Datos globales
  datosGlobales: ImpactoGlobalStats = {
    totalCO2Reducido: 0,
    kilometrosAlternativos: 0,
    usuariosVerdes: 0,
    rutasVerdesCreadas: 0,
    arbolesEquivalentes: 0,
    litrosCombustibleAhorrado: 0
  };

  // Evolución mensual
  evolucionMensual: EvolucionMensual[] = [];

  // Proyectos de reforestación
  proyectosReforestacion: ProyectoReforestacion[] = [];

  // Consejos sostenibles
  consejosSostenibles: ConsejoSostenible[] = [];

  // Subscripciones
  private subscriptions: Subscription[] = [];

  constructor(
    private impactoService: ImpactoMedioambientalService,
    private auditLog: AuditLogService
  ) { }

  ngOnInit(): void {
    this.loading = true;

    // Registrar visita a la página
    this.auditLog.log(
      'Visita a página de impacto medioambiental',
      'info',
      null,
      this.impactoService.getUserId(),
      'sistema'
    );

    // Cargar datos
    this.cargarDatos();

    // Suscribirse a cambios en los datos
    this.subscribeToDataChanges();

    // Cargar consejos sostenibles
    this.consejosSostenibles = this.impactoService.obtenerConsejosSostenibles();
  }

  ngOnDestroy(): void {
    // Cancelar todas las suscripciones
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Carga todos los datos necesarios para la página
   */
  cargarDatos(): void {
    this.loading = true;
    this.error = '';

    // Cargar rutas del usuario
    this.impactoService.cargarRutasUsuario()
      .then(rutas => {
        this.rutasUsuario = rutas;

        // Cargar proyectos de reforestación
        return this.impactoService.obtenerProyectosReforestacion();
      })
      .then(proyectos => {
        this.proyectosReforestacion = proyectos;
        this.loading = false;
      })
      .catch(error => {
        console.error('Error al cargar datos de impacto:', error);
        this.error = 'No se pudieron cargar los datos. Por favor, inténtalo de nuevo más tarde.';
        this.loading = false;

        // Registrar error
        this.auditLog.logError('Error al cargar datos de impacto', error, 'cargarDatos');
      });
  }

  /**
   * Suscribe el componente a los cambios en los datos
   */
  private subscribeToDataChanges(): void {
    // Suscripción a datos personales
    const personalSub = this.impactoService.getImpactoPersonal()
      .subscribe(datos => {
        if (datos) {
          this.datosPersonales = datos;
        }
      });

    // Suscripción a datos globales
    const globalSub = this.impactoService.getImpactoGlobal()
      .subscribe(datos => {
        if (datos) {
          this.datosGlobales = datos;
        }
      });

    // Suscripción a evolución mensual
    const evolucionSub = this.impactoService.getEvolucionMensual()
      .subscribe(datos => {
        if (datos && datos.length > 0) {
          this.evolucionMensual = datos;
        }
      });

    // Guardar suscripciones para limpieza
    this.subscriptions.push(personalSub, globalSub, evolucionSub);
  }

  /**
   * Unirse a un proyecto de reforestación
   */
  unirseProyecto(proyectoId: string): void {
    // Buscar el proyecto por ID
    const proyecto = this.proyectosReforestacion.find(p => p.id === proyectoId);

    if (!proyecto) {
      alert('Proyecto no encontrado');
      return;
    }

    this.impactoService.unirseProyecto(proyectoId)
      .then(() => {
        alert(`Te has unido al proyecto: ${proyecto.nombre}`);

        // Actualizar localmente el número de participantes
        proyecto.participantes += 1;
      })
      .catch(error => {
        console.error('Error al unirse al proyecto:', error);

        if (error.message === 'Ya estás unido a este proyecto') {
          alert('Ya estás unido a este proyecto');
        } else {
          alert('No se pudo unir al proyecto. Inténtalo de nuevo más tarde.');
        }
      });
  }

  /**
   * Contribuir al impacto global con los datos actuales
   */
  contribuirImpactoGlobal(): void {
    this.impactoService.contribuirImpactoGlobal(this.datosPersonales)
      .then(() => {
        alert('Has contribuido al impacto global con tus estadísticas personales');
      })
      .catch(error => {
        console.error('Error al contribuir al impacto global:', error);
        alert('No se pudo completar la operación. Inténtalo de nuevo más tarde.');
      });
  }

  /**
   * Recarga los datos de la página
   */
  recargarDatos(): void {
    this.cargarDatos();
  }

  /**
   * Calcula el porcentaje de usuarios verdes para los gráficos
   */
  calcularPorcentajeUsuariosVerdes(): number {
    return this.impactoService.calcularPorcentajeUsuariosVerdes();
  }

  /**
   * Devuelve la clase CSS correspondiente a la calificación
   */
  obtenerClaseCalificacion(): string {
    switch (this.datosPersonales.calificacionSostenibilidad) {
      case 'A': return 'eco-a';
      case 'B': return 'eco-b';
      case 'C': return 'eco-c';
      case 'D': return 'eco-d';
      case 'E': return 'eco-e';
      default: return 'eco-e';
    }
  }
}
