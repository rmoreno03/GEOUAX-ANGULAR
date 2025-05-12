import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Ruta, CarbonFootprintData, TipoRuta } from '../../../models/ruta.model';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  addDoc,
  setDoc
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { AuditLogService } from '../../../core/services/audit-log.service';

export interface ImpactoPersonalStats {
  rutasAlternativas: number;
  kilometrosAhorro: number;
  co2Reducido: number;
  arbolesEquivalentes: number;
  rutasVerdes: number;
  calificacionSostenibilidad: string;
}

export interface ImpactoGlobalStats {
  totalCO2Reducido: number;
  kilometrosAlternativos: number;
  usuariosVerdes: number;
  rutasVerdesCreadas: number;
  arbolesEquivalentes: number;
  litrosCombustibleAhorrado: number;
}

export interface EvolucionMensual {
  mes: string;
  co2: number;
  km: number;
}

export interface ProyectoReforestacion {
  id: string;
  nombre: string;
  arboles: number;
  fechaInicio: Date;
  participantes: number;
  completado: number;
  descripcion?: string;
  ubicacion?: string;
  imagenUrl?: string;
}

export interface ConsejoSostenible {
  titulo: string;
  descripcion: string;
  icono: string;
}

@Injectable({
  providedIn: 'root'
})
export class ImpactoMedioambientalService {
  // Medios de transporte considerados "verdes"
  private transportesVerdes = ['cycling', 'walking'];

  // Nombres en español para tipos de transporte
  private transporteNombres = {
    'cycling': 'En bicicleta',
    'walking': 'A pie',
    'driving': 'En coche',
    'bus': 'En autobús',
    'train': 'En tren'
  };

  // Almacenamiento en caché de estadísticas
  private impactoPersonalSubject = new BehaviorSubject<ImpactoPersonalStats | null>(null);
  private impactoGlobalSubject = new BehaviorSubject<ImpactoGlobalStats | null>(null);
  private evolucionMensualSubject = new BehaviorSubject<EvolucionMensual[]>([]);

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private auditLog: AuditLogService
  ) { }

  /**
   * Obtiene el usuario actual
   */
  public getUserId(): string | null {
    return this.auth.currentUser?.uid ?? null;
  }

  /**
   * Obtiene estadísticas personales del usuario como Observable
   */
  getImpactoPersonal(): Observable<ImpactoPersonalStats | null> {
    return this.impactoPersonalSubject.asObservable();
  }

  /**
   * Obtiene estadísticas globales como Observable
   */
  getImpactoGlobal(): Observable<ImpactoGlobalStats | null> {
    return this.impactoGlobalSubject.asObservable();
  }

  /**
   * Obtiene evolución mensual como Observable
   */
  getEvolucionMensual(): Observable<EvolucionMensual[]> {
    return this.evolucionMensualSubject.asObservable();
  }

  /**
   * Carga las rutas del usuario actual desde Firestore
   */
  async cargarRutasUsuario(): Promise<Ruta[]> {
    const userId = this.getUserId();
    if (!userId) {
      throw new Error('No hay usuario autenticado');
    }

    try {
      // Utilizar la colección de rutas
      const rutasRef = collection(this.firestore, 'rutas');
      const q = query(rutasRef, where('usuarioCreador', '==', userId));
      const querySnapshot = await getDocs(q);

      const rutas: Ruta[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data() as Omit<Ruta, 'id'>;
        rutas.push({
          id: doc.id,
          ...data
        });
      });

      // Calcular y actualizar estadísticas
      await this.actualizarEstadisticas(rutas);

      return rutas;
    } catch (error) {
      console.error('Error al cargar rutas del usuario:', error);
      await this.auditLog.logError('Error al cargar rutas del usuario', error, 'cargarRutasUsuario');
      throw error;
    }
  }

  /**
   * Actualiza estadísticas de impacto basadas en las rutas del usuario
   */
  private async actualizarEstadisticas(rutas: Ruta[]): Promise<void> {
    // Calcular estadísticas personales
    const impactoPersonal = this.calcularImpactoPersonal(rutas);
    this.impactoPersonalSubject.next(impactoPersonal);

    // Calcular evolución mensual
    const evolucionMensual = this.calcularEvolucionMensual(rutas);
    this.evolucionMensualSubject.next(evolucionMensual);

    // Cargar estadísticas globales
    await this.cargarEstadisticasGlobales();
  }

  /**
   * Calcula estadísticas personales de impacto ambiental
   */
  calcularImpactoPersonal(rutas: Ruta[]): ImpactoPersonalStats {
    // Filtrar rutas por transporte verde
    const rutasVerdes = rutas.filter(ruta =>
      this.transportesVerdes.includes(ruta.tipoRuta));

    // Calcular kilómetros en transporte verde
    const kilometrosAhorro = rutasVerdes.reduce((total, ruta) =>
      total + ruta.distanciaKm, 0);

    // Calcular CO2 reducido (comparado con usar coche)
    let co2Reducido = 0;

    // Para cada ruta "verde", calcular la diferencia con el CO2 que habría emitido en coche
    rutasVerdes.forEach(ruta => {
      // Si la ruta tiene carbonFootprint, usamos el dato, sino lo calculamos
      if (ruta.carbonFootprint) {
        // Para rutas verdes, el CO2 ahorrado es el que se habría emitido con coche
        // Para cada tipo verde (walking, cycling), la emisión es 0, por lo que el ahorro
        // es equivalente a lo que habría emitido en coche
        const emisionCoche = 0.171 * ruta.distanciaKm; // Factor de emisión del coche
        co2Reducido += emisionCoche;
      } else {
        // Cálculo básico: distancia * factor de emisión del coche (0.171 kg CO2/km)
        co2Reducido += 0.171 * ruta.distanciaKm;
      }
    });

    // Calcular árboles equivalentes (1 árbol absorbe ~22kg CO2 al año)
    const arbolesEquivalentes = co2Reducido / 22;

    // Calcular calificación de sostenibilidad
    const calificacionSostenibilidad = this.calcularCalificacionSostenibilidad(rutas);

    return {
      rutasAlternativas: rutasVerdes.length,
      kilometrosAhorro: Math.round(kilometrosAhorro),
      co2Reducido: Number(co2Reducido.toFixed(1)),
      arbolesEquivalentes: Number(arbolesEquivalentes.toFixed(1)),
      rutasVerdes: rutasVerdes.length,
      calificacionSostenibilidad
    };
  }

  /**
   * Calcula la calificación de sostenibilidad basada en rutas
   */
  private calcularCalificacionSostenibilidad(rutas: Ruta[]): string {
    if (rutas.length === 0) return 'E';

    // Calcular porcentaje de rutas verdes
    const rutasVerdes = rutas.filter(ruta =>
      this.transportesVerdes.includes(ruta.tipoRuta));

    const porcentajeVerde = (rutasVerdes.length / rutas.length) * 100;

    // Calcular emisiones promedio por km
    let emisionesTotal = 0;
    let distanciaTotal = 0;

    rutas.forEach(ruta => {
      distanciaTotal += ruta.distanciaKm;

      if (ruta.carbonFootprint) {
        emisionesTotal += ruta.carbonFootprint.totalEmission;
      } else {
        // Si no tiene carbonFootprint, estimar según el tipo
        const emision = this.estimarEmisionCO2(ruta.tipoRuta, ruta.distanciaKm);
        emisionesTotal += emision;
      }
    });

    const emisionesPromedio = distanciaTotal > 0 ? emisionesTotal / distanciaTotal : 0;

    // Determinar calificación basada en criterios combinados
    if (porcentajeVerde >= 80 && emisionesPromedio < 0.05) return 'A';
    if (porcentajeVerde >= 60 && emisionesPromedio < 0.08) return 'B';
    if (porcentajeVerde >= 40 && emisionesPromedio < 0.10) return 'C';
    if (porcentajeVerde >= 20 && emisionesPromedio < 0.15) return 'D';
    return 'E';
  }

  /**
   * Estima la emisión de CO2 según el tipo de ruta y distancia
   */
  private estimarEmisionCO2(tipoRuta: TipoRuta, distanciaKm: number): number {
    // Factores de emisión en kg CO2 por km
    const factoresEmision = {
      'walking': 0,
      'cycling': 0,
      'driving': 0.171
    };

    return (factoresEmision[tipoRuta] || 0.171) * distanciaKm;
  }

  /**
   * Calcula la evolución mensual de impacto ambiental
   */
  calcularEvolucionMensual(rutas: Ruta[], meses: number = 6): EvolucionMensual[] {
    const hoy = new Date();
    const resultado: EvolucionMensual[] = [];

    // Nombres de los meses en español
    const nombresMeses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    // Calcular para los últimos X meses
    for (let i = meses - 1; i >= 0; i--) {
      const fechaInicioMes = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const fechaFinMes = new Date(hoy.getFullYear(), hoy.getMonth() - i + 1, 0);

      // Filtrar rutas del mes actual en el bucle
      const rutasMes = rutas.filter(ruta => {
        const fechaRuta = ruta.fechaCreacion.toDate();
        return fechaRuta >= fechaInicioMes && fechaRuta <= fechaFinMes;
      });

      // Calcular estadísticas para el mes
      const rutasVerdesMes = rutasMes.filter(ruta =>
        this.transportesVerdes.includes(ruta.tipoRuta));

      const kilometrosMes = rutasVerdesMes.reduce((total, ruta) =>
        total + ruta.distanciaKm, 0);

      // Calcular CO2 reducido para el mes
      let co2ReducidoMes = 0;
      rutasVerdesMes.forEach(ruta => {
        const emisionCoche = 0.171 * ruta.distanciaKm; // Factor de emisión del coche
        co2ReducidoMes += emisionCoche;
      });

      // Obtener nombre del mes
      const nombreMes = nombresMeses[fechaInicioMes.getMonth()];

      resultado.push({
        mes: nombreMes,
        co2: Number(co2ReducidoMes.toFixed(1)),
        km: Math.round(kilometrosMes)
      });
    }

    return resultado;
  }

  /**
   * Carga estadísticas globales desde Firestore
   */
  private async cargarEstadisticasGlobales(): Promise<void> {
    try {
      // Intentar cargar desde Firestore
      const statsRef = doc(this.firestore, 'estadisticas/impactoGlobal');
      const docSnap = await getDoc(statsRef);

      if (docSnap.exists()) {
        // Si existe el documento, usamos esos datos
        const data = docSnap.data() as ImpactoGlobalStats;
        this.impactoGlobalSubject.next(data);
      } else {
        // Si no existe, crear datos iniciales
        const datosIniciales: ImpactoGlobalStats = {
          totalCO2Reducido: 42680,
          kilometrosAlternativos: 286540,
          usuariosVerdes: 8452,
          rutasVerdesCreadas: 15680,
          arbolesEquivalentes: 1945,
          litrosCombustibleAhorrado: 25680
        };

        // Guardar los datos iniciales en Firestore
        await updateDoc(statsRef, {
          ...datosIniciales,
          updatedAt: serverTimestamp()
        }).catch(() => {
          // Si falla el updateDoc (porque no existe), crearlo
          return setDoc(statsRef, {
            ...datosIniciales,
            updatedAt: serverTimestamp()
          });
        });

        this.impactoGlobalSubject.next(datosIniciales);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas globales:', error);

      // Datos por defecto en caso de error
      const datosPorDefecto: ImpactoGlobalStats = {
        totalCO2Reducido: 42680,
        kilometrosAlternativos: 286540,
        usuariosVerdes: 8452,
        rutasVerdesCreadas: 15680,
        arbolesEquivalentes: 1945,
        litrosCombustibleAhorrado: 25680
      };

      this.impactoGlobalSubject.next(datosPorDefecto);

      // Registrar error
      await this.auditLog.logError('Error al cargar estadísticas globales', error, 'cargarEstadisticasGlobales');
    }
  }

  /**
   * Contribuir al impacto global con estadísticas personales
   */
  async contribuirImpactoGlobal(impactoPersonal: ImpactoPersonalStats): Promise<void> {
    try {
      const statsRef = doc(this.firestore, 'estadisticas/impactoGlobal');
      const docSnap = await getDoc(statsRef);

      if (docSnap.exists()) {
        const datosActuales = docSnap.data() as ImpactoGlobalStats;

        // Incrementar valores con la contribución del usuario
        await updateDoc(statsRef, {
          totalCO2Reducido: datosActuales.totalCO2Reducido + impactoPersonal.co2Reducido,
          kilometrosAlternativos: datosActuales.kilometrosAlternativos + impactoPersonal.kilometrosAhorro,
          arbolesEquivalentes: datosActuales.arbolesEquivalentes + impactoPersonal.arbolesEquivalentes,
          rutasVerdesCreadas: datosActuales.rutasVerdesCreadas + impactoPersonal.rutasVerdes,
          updatedAt: serverTimestamp()
        });

        // Actualizar también el caché local
        const datosActualizados: ImpactoGlobalStats = {
          ...datosActuales,
          totalCO2Reducido: datosActuales.totalCO2Reducido + impactoPersonal.co2Reducido,
          kilometrosAlternativos: datosActuales.kilometrosAlternativos + impactoPersonal.kilometrosAhorro,
          arbolesEquivalentes: datosActuales.arbolesEquivalentes + impactoPersonal.arbolesEquivalentes,
          rutasVerdesCreadas: datosActuales.rutasVerdesCreadas + impactoPersonal.rutasVerdes
        };

        this.impactoGlobalSubject.next(datosActualizados);

        // Registrar contribución
        await this.auditLog.log(
          'Contribución a impacto global',
          'success',
          {
            co2: impactoPersonal.co2Reducido,
            km: impactoPersonal.kilometrosAhorro
          },
          this.getUserId(),
          'ruta'
        );
      }
    } catch (error) {
      console.error('Error al contribuir al impacto global:', error);
      await this.auditLog.logError('Error al contribuir al impacto global', error, 'contribuirImpactoGlobal');
    }
  }

  /**
   * Obtiene proyectos de reforestación
   */
  async obtenerProyectosReforestacion(): Promise<ProyectoReforestacion[]> {
    try {
      const proyectosRef = collection(this.firestore, 'proyectosReforestacion');
      const querySnapshot = await getDocs(proyectosRef);

      const proyectos: ProyectoReforestacion[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();

        proyectos.push({
          id: doc.id,
          nombre: data['nombre'],
          arboles: data['arboles'],
          fechaInicio: data['fechaInicio']?.toDate() || new Date(),
          participantes: data['participantes'] || 0,
          completado: data['completado'] || 0,
          descripcion: data['descripcion'],
          ubicacion: data['ubicacion'],
          imagenUrl: data['imagenUrl']
        });
      });

      // Si no hay proyectos, crear datos de ejemplo
      if (proyectos.length === 0) {
        const proyectosDemo = this.crearProyectosDemo();
        return proyectosDemo;
      }

      return proyectos;
    } catch (error) {
      console.error('Error al obtener proyectos de reforestación:', error);

      // En caso de error, devolver proyectos de demostración
      const proyectosDemo = this.crearProyectosDemo();

      // Registrar error
      await this.auditLog.logError('Error al obtener proyectos de reforestación', error, 'obtenerProyectosReforestacion');

      return proyectosDemo;
    }
  }

  /**
   * Crea proyectos de reforestación de demostración
   */
  private crearProyectosDemo(): ProyectoReforestacion[] {
    return [
      {
        id: 'demo1',
        nombre: 'Reforestación Sierra Norte',
        arboles: 850,
        fechaInicio: new Date('2024-10-15'),
        participantes: 124,
        completado: 78,
        descripcion: 'Proyecto de reforestación en la Sierra Norte para recuperar zonas afectadas por incendios.',
        ubicacion: 'Sierra Norte, Madrid'
      },
      {
        id: 'demo2',
        nombre: 'Recuperación Bosque Mediterráneo',
        arboles: 1250,
        fechaInicio: new Date('2024-11-22'),
        participantes: 186,
        completado: 45,
        descripcion: 'Recuperación de especies autóctonas del bosque mediterráneo en zonas degradadas.',
        ubicacion: 'Provincia de Valencia'
      },
      {
        id: 'demo3',
        nombre: 'Cinturón Verde Madrid',
        arboles: 620,
        fechaInicio: new Date('2025-02-08'),
        participantes: 92,
        completado: 30,
        descripcion: 'Creación de un cinturón verde alrededor de Madrid para mejorar la calidad del aire.',
        ubicacion: 'Comunidad de Madrid'
      }
    ];
  }

  /**
   * Unirse a un proyecto de reforestación
   */
  async unirseProyecto(proyectoId: string): Promise<void> {
    const userId = this.getUserId();
    if (!userId) {
      throw new Error('No hay usuario autenticado');
    }

    try {
      // Obtener referencia al proyecto
      const proyectoRef = doc(this.firestore, `proyectosReforestacion/${proyectoId}`);
      const proyectoSnap = await getDoc(proyectoRef);

      if (!proyectoSnap.exists()) {
        throw new Error('El proyecto no existe');
      }

      // Verificar si el usuario ya está unido al proyecto
      const participantesRef = collection(this.firestore, `proyectosReforestacion/${proyectoId}/participantes`);
      const q = query(participantesRef, where('userId', '==', userId));
      const participanteSnap = await getDocs(q);

      if (!participanteSnap.empty) {
        throw new Error('Ya estás unido a este proyecto');
      }

      // Añadir al usuario como participante
      await addDoc(participantesRef, {
        userId,
        fechaUnion: serverTimestamp(),
        arbolesPropios: 0
      });

      // Incrementar contador de participantes
      const datosProyecto = proyectoSnap.data();
      await updateDoc(proyectoRef, {
        participantes: (datosProyecto['participantes'] || 0) + 1,
        updatedAt: serverTimestamp()
      });

      // Registrar acción
      await this.auditLog.log(
        'Unión a proyecto de reforestación',
        'success',
        {
          proyectoId,
          nombreProyecto: datosProyecto['nombre']
        },
        userId,
        'sistema'
      );
    } catch (error) {
      console.error('Error al unirse al proyecto:', error);
      await this.auditLog.logError('Error al unirse al proyecto', error, 'unirseProyecto');
      throw error;
    }
  }

  /**
   * Obtiene consejos de sostenibilidad
   */
  obtenerConsejosSostenibles(): ConsejoSostenible[] {
    return [
      {
        titulo: 'Planifica rutas más eficientes',
        descripcion: 'Utiliza rutas circulares y evita trayectos redundantes para reducir la distancia total.',
        icono: 'route'
      },
      {
        titulo: 'Usa transporte público en el acceso',
        descripcion: 'Considera usar transporte público para llegar al inicio de tus rutas cuando sea posible.',
        icono: 'bus'
      },
      {
        titulo: 'Compartir vehículo',
        descripcion: 'Coordínate con otros usuarios para compartir vehículo y reducir la huella de carbono.',
        icono: 'car-side'
      },
      {
        titulo: 'Lleva tu basura de vuelta',
        descripcion: 'No dejes residuos en las rutas y contribuye a mantener los espacios naturales limpios.',
        icono: 'trash-restore'
      },
      {
        titulo: 'Utiliza bicicleta o camina',
        descripcion: 'Para rutas urbanas o de corta distancia, prioriza medios de transporte sin emisiones.',
        icono: 'walking'
      }
    ];
  }

  /**
   * Traduce el tipo de ruta a un nombre legible
   */
  obtenerNombreTransporte(tipo: TipoRuta): string {
    return this.transporteNombres[tipo as keyof typeof this.transporteNombres] || tipo;
  }

  /**
   * Actualiza la huella de carbono de una ruta
   */
  async actualizarHuellaCarbono(rutaId: string, carbonFootprint: CarbonFootprintData): Promise<void> {
    try {
      const rutaRef = doc(this.firestore, `rutas/${rutaId}`);
      await updateDoc(rutaRef, {
        carbonFootprint,
        updatedAt: serverTimestamp()
      });

      // Registrar actualización
      await this.auditLog.log(
        'Huella de carbono actualizada',
        'success',
        {
          rutaId,
          emision: carbonFootprint.totalEmission
        },
        this.getUserId(),
        'ruta'
      );
    } catch (error) {
      console.error('Error al actualizar huella de carbono:', error);
      await this.auditLog.logError('Error al actualizar huella de carbono', error, 'actualizarHuellaCarbono');
      throw error;
    }
  }

  /**
   * Simula la huella de carbono para una ruta nueva o existente
   */
  simularHuellaCarbono(tipoRuta: TipoRuta, distanciaKm: number): CarbonFootprintData {
    // Factores de emisión en kg CO2 por km
    const factoresEmision = {
      'walking': 0,
      'cycling': 0,
      'driving': 0.171
    };

    // Calcular emisión total
    const factorEmision = factoresEmision[tipoRuta as keyof typeof factoresEmision] || factoresEmision.driving;
    const totalEmission = factorEmision * distanciaKm;

    // Calcular equivalencias
    const equivalentActivities = {
      treeDays: Math.round((totalEmission / 22) * 365),
      lightBulbHours: Math.round(totalEmission / 0.005),
      meatMeals: Math.round(totalEmission / 6.5)
    };

    // Generar recomendaciones
    const recommendations = this.generarRecomendaciones(tipoRuta, distanciaKm);

    return {
      totalEmission,
      transportType: this.obtenerNombreTransporte(tipoRuta),
      equivalentActivities,
      recommendations
    };
  }

  /**
   * Genera recomendaciones basadas en el tipo de transporte y distancia
   */
  private generarRecomendaciones(tipoRuta: TipoRuta, distanciaKm: number): string[] {
    const recomendaciones: string[] = [];

    // Recomendaciones para distancias cortas (< 5 km)
    if (distanciaKm < 5) {
      if (tipoRuta !== 'walking' && tipoRuta !== 'cycling') {
        recomendaciones.push('Para distancias cortas, considera caminar o usar bicicleta para reducir emisiones a cero.');
      }
    }
    // Recomendaciones para distancias medias (5-20 km)
    else if (distanciaKm >= 5 && distanciaKm < 20) {
      if (tipoRuta === 'driving') {
        recomendaciones.push('Para esta distancia, la bicicleta o el transporte público reducirían significativamente tu huella de carbono.');
      }
    }
    // Recomendaciones para distancias largas (>20 km)
    else {
      if (tipoRuta === 'driving') {
        recomendaciones.push('Para viajes largos, considera el transporte público como autobuses para reducir emisiones.');
      }
    }

    // Recomendaciones específicas por tipo de transporte
    if (tipoRuta === 'driving') {
      recomendaciones.push('Compartir el viaje con más personas reduce significativamente la huella de carbono por persona.');
      recomendaciones.push('Una conducción eficiente (velocidad constante, aceleraciones suaves) puede reducir el consumo hasta un 20%.');
    }

    // Asegurarse de que siempre hay al menos una recomendación
    if (recomendaciones.length === 0) {
      if (tipoRuta === 'walking' || tipoRuta === 'cycling') {
        recomendaciones.push('¡Excelente elección! Continúa usando este método de transporte sostenible.');
      } else {
        recomendaciones.push('Considera alternativas de transporte más sostenibles cuando sea posible.');
      }
    }

    return recomendaciones;
  }

  /**
   * Calcula el porcentaje de usuarios verdes (para gráficos)
   */
  calcularPorcentajeUsuariosVerdes(): number {
    const datosGlobales = this.impactoGlobalSubject.value;
    if (!datosGlobales) return 0;

    // Suponiendo un total global de 15000 usuarios (configurable)
    const totalUsuarios = 15000;
    return (datosGlobales.usuariosVerdes / totalUsuarios) * 100;
  }

  private async setDoc(docRef: any, data: any): Promise<void> {
    try {
      await updateDoc(docRef, data);
    } catch (error) {
      // Si el documento no existe, crearlo
      await setDoc(docRef, data);
    }
  }
}
