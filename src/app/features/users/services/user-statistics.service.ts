import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp
} from '@angular/fire/firestore';
import { AuthService } from '../../../auth/services/auth.service';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { Ruta } from '../../../models/ruta.model';
import { PuntoLocalizacion } from '../../../models/punto-localizacion.model';

export interface PuntoInteres {
  nombre: string;
  visitas: number;
}

export interface ActividadMensual {
  mes: string;
  rutas: number;
  kilometros: number;
}

export interface DistribucionTipo {
  tipo: string;
  porcentaje: number;
  rutas: number;
}

export interface RutaMasLarga {
  nombre: string;
  distancia: number;
  fecha: Date | Timestamp;
}

export interface ProgresoRuta {
  id: string;
  fechaFin: Timestamp;
  [key: string]: any;
}


export interface EstadisticasUsuario {
  totalRutas: number;
  totalPuntos: number;
  totalKilometros: number;
  mediaKilometros: number;
  tiempoTotal: string;
  mediaVelocidad: string;
  altitudMaxima: number;
  desnivelAcumulado: number;
  rutaMasLarga: RutaMasLarga;
  puntosInteres: PuntoInteres[];
  actividadMensual: ActividadMensual[];
  distribucionTipos: DistribucionTipo[];
  logrosConseguidos: number;
  totalLogros: number;
  retosCompletados: number;
  retosActivos: number;
}

export type TipoActividad = 'ruta' | 'punto' | 'logro' | 'reto';

export interface Actividad {
  tipo: TipoActividad;
  nombre: string;
  fecha: Date | Timestamp;
  kilometros?: number;
  tiempo?: string;
  ubicacion?: string;
  descripcion?: string;
  progreso?: number;
}

export type PeriodoTiempo = 'semanal' | 'mensual' | 'trimestral' | 'anual' | 'total';

@Injectable({
  providedIn: 'root'
})
export class UserStatisticsService {

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private auditLog: AuditLogService
  ) {}

  /**
   * Obtiene las estadísticas completas de un usuario
   */
  async getUserStatistics(userId: string, periodo: PeriodoTiempo = 'total'): Promise<EstadisticasUsuario> {
    try {
      // Definir el periodo de tiempo
      const fechaLimite = this.obtenerFechaLimite(periodo);

      // 1. Obtener rutas del usuario (sin ordenar para evitar error de índice)
      const rutasRef = collection(this.firestore, 'rutas');
      let rutasQuery = query(
        rutasRef,
        where('usuarioCreador', '==', userId)
      );

      // Intentar realizar consulta con y sin ordenamiento
      let rutasSnapshot;
      let rutas: Ruta[] = [];

      try {
        // Intentar con ordenamiento
        const orderedQuery = query(rutasQuery, orderBy('fechaCreacion', 'desc'));
        rutasSnapshot = await getDocs(orderedQuery);
        rutas = rutasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ruta));
      } catch (error) {
        console.warn('Error al ordenar rutas. Obteniendo sin orden:', error);

        // Si falla, intentar sin ordenamiento
        rutasSnapshot = await getDocs(rutasQuery);
        rutas = rutasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ruta));

        // Ordenar manualmente
        rutas.sort((a, b) => {
          const fechaA = a.fechaCreacion instanceof Timestamp ?
            a.fechaCreacion.toDate().getTime() :
            new Date(a.fechaCreacion as any).getTime();

          const fechaB = b.fechaCreacion instanceof Timestamp ?
            b.fechaCreacion.toDate().getTime() :
            new Date(b.fechaCreacion as any).getTime();

          return fechaB - fechaA; // Orden descendente
        });
      }

      // Filtrar por fecha si es necesario
      if (fechaLimite) {
        const fechaLimiteMs = fechaLimite.getTime();
        rutas = rutas.filter(ruta => {
          const fechaRuta = ruta.fechaCreacion instanceof Timestamp ?
            ruta.fechaCreacion.toDate().getTime() :
            new Date(ruta.fechaCreacion as any).getTime();

          return fechaRuta >= fechaLimiteMs;
        });
      }

      // 2. Obtener puntos del usuario (sin ordenar para evitar error de índice)
      const puntosRef = collection(this.firestore, 'puntos_localizacion');
      let puntosQuery = query(
        puntosRef,
        where('usuarioCreador', '==', userId)
      );

      const puntosSnapshot = await getDocs(puntosQuery);
      let puntos: PuntoLocalizacion[] = puntosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PuntoLocalizacion));

      // Filtrar puntos por fecha si es necesario
      if (fechaLimite) {
        const fechaLimiteMs = fechaLimite.getTime();
        puntos = puntos.filter(punto => {
          if (!punto['fechaCreacion']) return false;

          const fechaPunto = punto['fechaCreacion'] instanceof Timestamp ?
            punto['fechaCreacion'].toDate().getTime() :
            new Date(punto['fechaCreacion'] as any).getTime();

          return fechaPunto >= fechaLimiteMs;
        });
      }

      // 3. Obtener progreso de rutas
      const progresoRef = collection(this.firestore, 'progreso-rutas');
      let progresoQuery = query(
        progresoRef,
        where('usuarioId', '==', userId),
        where('completado', '==', true)
      );

      // Filtrar por fecha si es necesario
      let rutasCompletadas = 0;
      try {
        const progresoSnapshot = await getDocs(progresoQuery);
        let progresos: ProgresoRuta[] = progresoSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProgresoRuta));

        if (fechaLimite) {
          const fechaLimiteMs = fechaLimite.getTime();
          progresos = progresos.filter(progreso => {
            if (!progreso['fechaFin']) return false;

            const fechaFin = progreso['fechaFin'] instanceof Timestamp ?
              progreso['fechaFin'].toDate().getTime() :
              new Date(progreso['fechaFin'] as any).getTime();

            return fechaFin >= fechaLimiteMs;
          });
        }

        rutasCompletadas = progresos.length;
      } catch (error) {
        console.warn('Error al obtener progreso de rutas:', error);
        // Continuar sin progreso
      }

      // Calcular estadísticas
      const totalRutas = rutas.length;
      const totalPuntos = puntos.length;

      // Calcular kilometraje total
      let totalKilometros = 0;
      let altitudMaxima = 0;
      let desnivelAcumulado = 0;
      let tiempoTotalMinutos = 0;
      let rutaMasLarga = { nombre: 'Sin rutas', distancia: 0, fecha: new Date() };

      // Mapa de tipos de rutas para la distribución
      const tiposRutas: Record<string, number> = {};

      // Datos mensuales para el gráfico
      const actividadPorMes: Record<string, { mes: string, rutas: number, kilometros: number }> = {};

      // Para puntos más visitados
      const visitasPuntos: Record<string, number> = {};

      // Procesar rutas
      rutas.forEach((ruta: Ruta) => {
        // Kilometraje
        totalKilometros += ruta.distanciaKm || 0;

        // Tiempo
        tiempoTotalMinutos += ruta.duracionMin || 0;

        // Altitud y desnivel (si existe)
        if (ruta.altitudMaxima && ruta.altitudMaxima > altitudMaxima) {
          altitudMaxima = ruta.altitudMaxima;
        }

        if (ruta.desnivelAcumulado) {
          desnivelAcumulado += ruta.desnivelAcumulado;
        }

        // Ruta más larga
        if (ruta.distanciaKm > rutaMasLarga.distancia) {
          rutaMasLarga = {
            nombre: ruta.nombre || 'Sin nombre',
            distancia: ruta.distanciaKm || 0,
            fecha: ruta.fechaCreacion instanceof Timestamp ? ruta.fechaCreacion.toDate() : new Date(ruta.fechaCreacion as any)
          };
        }

        // Tipos de rutas
        const tipo = ruta.tipoRuta || 'Otro';
        tiposRutas[tipo] = (tiposRutas[tipo] || 0) + 1;

        // Actividad mensual
        if (ruta.fechaCreacion) {
          const fecha = ruta.fechaCreacion instanceof Timestamp
            ? ruta.fechaCreacion.toDate()
            : new Date(ruta.fechaCreacion as any);

          const mesKey = `${fecha.getFullYear()}-${fecha.getMonth() + 1}`;
          const nombreMes = fecha.toLocaleDateString('es-ES', { month: 'long' });

          if (!actividadPorMes[mesKey]) {
            actividadPorMes[mesKey] = {
              mes: this.capitalizarPrimeraLetra(nombreMes),
              rutas: 0,
              kilometros: 0
            };
          }

          actividadPorMes[mesKey].rutas += 1;
          actividadPorMes[mesKey].kilometros += ruta.distanciaKm || 0;
        }

        // Puntos de la ruta (para visitas)
        if (ruta.puntos && Array.isArray(ruta.puntos)) {
          ruta.puntos.forEach((punto: any) => {
            if (punto.nombre) {
              visitasPuntos[punto.nombre] = (visitasPuntos[punto.nombre] || 0) + 1;
            }
          });
        }
      });

      // Convertir distribución de tipos a formato para gráfico
      const distribucionTipos: DistribucionTipo[] = Object.entries(tiposRutas)
        .filter(([tipo, cantidad]) => cantidad > 0)
        .map(([tipo, cantidad]) => ({
          tipo: this.capitalizarPrimeraLetra(tipo),
          rutas: cantidad,
          porcentaje: totalRutas > 0 ? Math.round((cantidad / totalRutas) * 100) : 0
        }))
        .sort((a, b) => b.rutas - a.rutas);

      // Asegurar que haya al menos una entrada para otros tipos
      if (distribucionTipos.length === 0) {
        distribucionTipos.push({
          tipo: 'No hay rutas',
          rutas: 0,
          porcentaje: 0
        });
      }

      // Convertir actividad mensual a formato para gráfico (últimos 6 meses)
      const actividadMensual: ActividadMensual[] = Object.values(actividadPorMes)
        .sort((a, b) => a.mes.localeCompare(b.mes))
        .slice(-6)
        .map(item => ({
          mes: item.mes,
          rutas: item.rutas,
          kilometros: Math.round(item.kilometros)
        }));

      // Asegurar que hay datos para mostrar en el gráfico
      if (actividadMensual.length === 0) {
        // Agregar datos de ejemplo
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'];
        actividadMensual.push(...meses.map(mes => ({
          mes,
          rutas: 0,
          kilometros: 0
        })));
      }

      // Convertir puntos visitados a formato para listado
      const puntosInteres: PuntoInteres[] = Object.entries(visitasPuntos)
        .map(([nombre, visitas]) => ({ nombre, visitas }))
        .sort((a, b) => b.visitas - a.visitas)
        .slice(0, 5);

      // Si no hay puntos, agregar mensaje de ejemplo
      if (puntosInteres.length === 0) {
        puntosInteres.push({ nombre: 'Sin puntos registrados', visitas: 0 });
      }

      // Calcular tiempo total en formato legible
      const horas = Math.floor(tiempoTotalMinutos / 60);
      const minutos = Math.floor(tiempoTotalMinutos % 60);
      const tiempoTotal = `${horas}h ${minutos}m`;

      // Calcular velocidad media
      const mediaVelocidad = totalRutas > 0 && tiempoTotalMinutos > 0
        ? `${(totalKilometros / (tiempoTotalMinutos / 60)).toFixed(1)} km/h`
        : '0 km/h';

      // Calcular media de kilómetros por ruta
      const mediaKilometros = totalRutas > 0 ? (totalKilometros / totalRutas) : 0;

      // Obtener estadísticas de logros y retos (simulados por ahora)
      const logrosConseguidos = Math.min(12, Math.floor(totalRutas / 2)); // Simulado basado en rutas
      const totalLogros = 25; // Valor fijo por ahora
      const retosActivos = 2; // Valor fijo por ahora

      // Log de la acción
      await this.auditLog.log(
        'Obtención de estadísticas de usuario',
        'info',
        {
          userId,
          periodo,
          totalRutas,
          totalPuntos,
          totalKilometros
        },
        userId || null, // Asegurar que no sea undefined
        'usuario'
      );

      // Construir el objeto completo de estadísticas
      return {
        totalRutas,
        totalPuntos,
        totalKilometros,
        mediaKilometros,
        tiempoTotal,
        mediaVelocidad,
        altitudMaxima,
        desnivelAcumulado,
        rutaMasLarga,
        puntosInteres,
        actividadMensual,
        distribucionTipos,
        logrosConseguidos,
        totalLogros,
        retosCompletados: rutasCompletadas,
        retosActivos
      };
    } catch (error) {
      console.error('Error al obtener estadísticas del usuario:', error);

      // Log de error
      await this.auditLog.logError('Error al obtener estadísticas de usuario', error, 'getUserStatistics');

      // Devolver estadísticas vacías
      return {
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
        puntosInteres: [{ nombre: 'Sin puntos registrados', visitas: 0 }],
        actividadMensual: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'].map(mes => ({
          mes,
          rutas: 0,
          kilometros: 0
        })),
        distribucionTipos: [{ tipo: 'No hay rutas', rutas: 0, porcentaje: 0 }],
        logrosConseguidos: 0,
        totalLogros: 25,
        retosCompletados: 0,
        retosActivos: 0
      };
    }
  }

  /**
   * Obtiene la actividad reciente de un usuario
   */
  async getUserActivity(userId: string, maxResult: number = 10): Promise<Actividad[]> {
    try {
      const actividades: Actividad[] = [];

      // 1. Obtener rutas recientes
      try {
        const rutasRef = collection(this.firestore, 'rutas');
        let rutasQuery = query(
          rutasRef,
          where('usuarioCreador', '==', userId)
        );

        // Intentar con ordenamiento
        let rutasSnapshot;
        try {
          const orderedQuery = query(rutasQuery, orderBy('fechaCreacion', 'desc'), limit(maxResult));
          rutasSnapshot = await getDocs(orderedQuery);
        } catch (error) {
          console.warn('Error al ordenar actividad reciente. Obteniendo sin orden:', error);

          // Si falla, intentar sin ordenamiento
          rutasSnapshot = await getDocs(rutasQuery);
        }

        // Convertir documentos a objetos
        let rutasActividad: Ruta[] = rutasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ruta));

        // Ordenar manualmente si es necesario y limitar
        rutasActividad.sort((a, b) => {
          const fechaA = a['fechaCreacion'] instanceof Timestamp ?
            a['fechaCreacion'].toDate().getTime() :
            new Date(a['fechaCreacion'] as any).getTime();

          const fechaB = b['fechaCreacion'] instanceof Timestamp ?
            b['fechaCreacion'].toDate().getTime() :
            new Date(b['fechaCreacion'] as any).getTime();

          return fechaB - fechaA; // Orden descendente
        });

        // Limitar a los elementos requeridos
        rutasActividad = rutasActividad.slice(0, maxResult);

        // Procesar cada ruta
        rutasActividad.forEach(ruta => {
          // Cálculo del tiempo en formato legible
          const duracionMin = ruta['duracionMin'] || 0;
          const horas = Math.floor(duracionMin / 60);
          const minutos = Math.floor(duracionMin % 60);
          const tiempo = `${horas}h ${minutos}m`;

          actividades.push({
            tipo: 'ruta',
            nombre: ruta['nombre'] || 'Ruta sin nombre',
            fecha: ruta['fechaCreacion'] || new Date(),
            kilometros: ruta['distanciaKm'] || 0,
            tiempo
          });
        });
      } catch (error) {
        console.warn('Error al obtener rutas para actividad reciente:', error);
        // Continuar con otras actividades
      }

      // 2. Obtener puntos de localización recientes
      try {
        const puntosRef = collection(this.firestore, 'puntos_localizacion');
        let puntosQuery = query(
          puntosRef,
          where('usuarioCreador', '==', userId)
        );

        // Intentar con ordenamiento
        let puntosSnapshot;
        try {
          const orderedQuery = query(puntosQuery, orderBy('fechaCreacion', 'desc'), limit(Math.floor(maxResult / 2)));
          puntosSnapshot = await getDocs(orderedQuery);
        } catch (error) {
          console.warn('Error al ordenar puntos en actividad reciente. Obteniendo sin orden:', error);

          // Si falla, intentar sin ordenamiento
          puntosSnapshot = await getDocs(puntosQuery);
        }

        // Convertir documentos a objetos
        let puntosActividad: PuntoLocalizacion[] = puntosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PuntoLocalizacion));

        // Ordenar manualmente si es necesario y limitar
        puntosActividad.sort((a, b) => {
          const fechaA = a['fechaCreacion'] instanceof Timestamp ?
            a['fechaCreacion'].toDate().getTime() :
            new Date(a['fechaCreacion'] as any).getTime();

          const fechaB = b['fechaCreacion'] instanceof Timestamp ?
            b['fechaCreacion'].toDate().getTime() :
            new Date(b['fechaCreacion'] as any).getTime();

          return fechaB - fechaA; // Orden descendente
        });

        // Limitar a los elementos requeridos
        puntosActividad = puntosActividad.slice(0, Math.floor(maxResult / 2));

        puntosActividad.forEach(punto => {
          actividades.push({
            tipo: 'punto',
            nombre: punto['nombre'] || 'Punto sin nombre',
            fecha: punto['fechaCreacion'] || new Date(),
            ubicacion: this.obtenerUbicacion(punto['latitud'], punto['longitud'])
          });
        });
      } catch (error) {
        console.warn('Error al obtener puntos para actividad reciente:', error);
        // Continuar con otras actividades
      }

      // 3. Obtener logros (simulados por ahora)
      // Si hay suficientes actividades, agregamos logros simulados
      if (actividades.length >= 2) {
        const logrosSimulados = [
          {
            nombre: 'Explorador de Altura',
            descripcion: 'Visitar 5 puntos con altitud superior a 1500m',
            fecha: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5) // 5 días atrás
          },
          {
            nombre: 'Senderista Experto',
            descripcion: 'Completar 10 rutas de senderismo',
            fecha: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10) // 10 días atrás
          }
        ];

        actividades.push({
          tipo: 'logro',
          nombre: logrosSimulados[0].nombre,
          fecha: logrosSimulados[0].fecha,
          descripcion: logrosSimulados[0].descripcion
        });

        // Si hay muchas actividades, agregamos otro logro
        if (actividades.length >= 4) {
          actividades.push({
            tipo: 'logro',
            nombre: logrosSimulados[1].nombre,
            fecha: logrosSimulados[1].fecha,
            descripcion: logrosSimulados[1].descripcion
          });
        }
      }

      // 4. Obtener retos (simulados por ahora)
      // Si hay suficientes actividades, agregamos un reto simulado
      if (actividades.length >= 1) {
        const retosSimulados = [
          {
            nombre: '100km en un mes',
            descripcion: 'Completar 100km en rutas registradas durante un mes',
            progreso: 85,
            fecha: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15) // 15 días atrás
          }
        ];

        actividades.push({
          tipo: 'reto',
          nombre: retosSimulados[0].nombre,
          fecha: retosSimulados[0].fecha,
          descripcion: retosSimulados[0].descripcion,
          progreso: retosSimulados[0].progreso
        });
      }

      // Ordenar por fecha (más reciente primero)
      const actividadesOrdenadas = actividades.sort((a, b) => {
        const fechaA = a.fecha instanceof Date ? a.fecha : a.fecha.toDate();
        const fechaB = b.fecha instanceof Date ? b.fecha : b.fecha.toDate();
        return fechaB.getTime() - fechaA.getTime();
      });

      // Log de la acción
      await this.auditLog.log(
        'Obtención de actividad reciente de usuario',
        'info',
        {
          userId,
          cantidadActividades: actividadesOrdenadas.length
        },
        userId || null, // Asegurar que no sea undefined
        'usuario'
      );

      return actividadesOrdenadas.slice(0, maxResult);
    } catch (error) {
      console.error('Error al obtener actividad reciente del usuario:', error);

      // Log de error
      await this.auditLog.logError('Error al obtener actividad reciente', error, 'getUserActivity');

      // Devolver array vacío
      return [];
    }
  }

  /**
   * Exporta las estadísticas de usuario en formato CSV
   */
  async exportUserStatistics(userId: string, periodo: PeriodoTiempo = 'total'): Promise<string> {
    try {
      // Obtener estadísticas
      const stats = await this.getUserStatistics(userId, periodo);

      // Formatear para CSV
      const lines = [
        // Cabecera
        'Estadísticas del usuario',
        `Período: ${periodo}`,
        '',
        // Métricas generales
        'Métricas generales',
        'Métrica,Valor',
        `Total de rutas,${stats.totalRutas}`,
        `Total de puntos de interés,${stats.totalPuntos}`,
        `Total de kilómetros,${stats.totalKilometros.toFixed(1)}`,
        `Media de kilómetros por ruta,${stats.mediaKilometros.toFixed(1)}`,
        `Tiempo total,${stats.tiempoTotal}`,
        `Velocidad media,${stats.mediaVelocidad}`,
        `Altitud máxima alcanzada,${stats.altitudMaxima} m`,
        `Desnivel acumulado,${stats.desnivelAcumulado} m`,
        `Logros conseguidos,${stats.logrosConseguidos}/${stats.totalLogros}`,
        `Retos completados,${stats.retosCompletados}`,
        '',
        // Ruta más larga
        'Ruta más larga',
        'Nombre,Distancia,Fecha',
        `${stats.rutaMasLarga.nombre},${stats.rutaMasLarga.distancia.toFixed(1)} km,${this.formatDate(stats.rutaMasLarga.fecha)}`,
        '',
        // Puntos de interés
        'Puntos de interés más visitados',
        'Nombre,Visitas',
        ...stats.puntosInteres.map(p => `${p.nombre},${p.visitas}`),
        '',
        // Distribución de tipos
        'Distribución por tipo de ruta',
        'Tipo,Rutas,Porcentaje',
        ...stats.distribucionTipos.map(d => `${d.tipo},${d.rutas},${d.porcentaje}%`),
        '',
        // Actividad mensual
        'Actividad mensual',
        'Mes,Rutas,Kilómetros',
        ...stats.actividadMensual.map(a => `${a.mes},${a.rutas},${a.kilometros}`)
      ];

      // Log de la acción
      await this.auditLog.log(
        'Exportación de estadísticas de usuario',
        'info',
        {
          userId,
          periodo,
          formato: 'CSV'
        },
        userId || null, // Asegurar que no sea undefined
        'usuario'
      );

      return lines.join('\n');
    } catch (error) {
      console.error('Error al exportar estadísticas de usuario:', error);

      // Log de error
      await this.auditLog.logError('Error al exportar estadísticas', error, 'exportUserStatistics');

      // Devolver mensaje de error
      return 'Error al exportar estadísticas. Por favor, inténtelo de nuevo.';
    }
  }

  // UTILIDADES

  /**
   * Obtiene una fecha límite según el periodo seleccionado
   */
  private obtenerFechaLimite(periodo: PeriodoTiempo): Date | null {
    if (periodo === 'total') {
      return null;
    }

    const now = new Date();
    const fecha = new Date(now);

    switch (periodo) {
      case 'semanal':
        fecha.setDate(now.getDate() - 7);
        break;
      case 'mensual':
        fecha.setMonth(now.getMonth() - 1);
        break;
      case 'trimestral':
        fecha.setMonth(now.getMonth() - 3);
        break;
      case 'anual':
        fecha.setFullYear(now.getFullYear() - 1);
        break;
    }

    return fecha;
  }

  /**
   * Formatea una fecha para mostrarla
   */
  private formatDate(fecha: Date | Timestamp): string {
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

  /**
   * Utilidad para obtener una ubicación legible a partir de coordenadas
   */
  private obtenerUbicacion(latitud?: number, longitud?: number): string {
    if (!latitud || !longitud) return 'Ubicación desconocida';

    // En un sistema real, aquí se podría usar geocodificación inversa
    // Por ahora, devolvemos una cadena simple con las coordenadas formateadas
    return `${latitud.toFixed(3)}°, ${longitud.toFixed(3)}°`;
  }

  /**
   * Capitaliza la primera letra de un texto
   */
  private capitalizarPrimeraLetra(texto: string): string {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }
}
