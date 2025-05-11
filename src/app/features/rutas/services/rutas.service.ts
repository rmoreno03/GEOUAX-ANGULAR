import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  query,
  where
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import mbxDirections from '@mapbox/mapbox-sdk/services/directions';
import { environment } from '../../../../environments/environment';
import { Ruta, CarbonFootprintData } from '../../../models/ruta.model';
import { TipoRuta } from '../../../models/ruta.model';
import { PuntoLocalizacion } from '../../../models/punto-localizacion.model';
import { CarbonFootprintService } from './carbonFootprint.service';
import { AuditLogService } from '../../../core/services/audit-log.service';

interface ComparativaTransporte {
  type: string;
  emission: number;
  label: string;
  class: string;
}

@Injectable({ providedIn: 'root' })
export class RutasService {
  private rutasRef;
  directionsClient = mbxDirections({ accessToken: environment.mapbox_key });

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private carbonService: CarbonFootprintService,
    private auditLog: AuditLogService // NUEVO
  ) {
    this.rutasRef = collection(this.firestore, 'rutas');
  }

  public getUserId(): string | null {
    return this.auth.currentUser?.uid ?? null;
  }

  private validarTipoRuta(tipo: unknown): TipoRuta {
    if (tipo === 'driving' || tipo === 'walking' || tipo === 'cycling') {
      return tipo as TipoRuta;
    }
    if (tipo && typeof tipo === 'object' && 'value' in tipo) {
      if (typeof (tipo as { value?: string })?.value === 'string') {
        const value = (tipo as { value: string }).value;
        if (value === 'driving' || value === 'walking' || value === 'cycling') {
          return value as TipoRuta;
        }
      }
    }
    return 'driving';
  }

  // Método modificado para incluir cálculo de huella de carbono
  async crearRuta(
    rutaParcial: Omit<Ruta, 'fechaCreacion' | 'usuarioCreador' | 'distanciaKm' | 'duracionMin' | 'imagenUrl'>
  ): Promise<void> {
    const tipoRuta = this.validarTipoRuta(rutaParcial.tipoRuta);

    const waypoints = rutaParcial.puntos.map(p => ({
      coordinates: [p.longitud, p.latitud]
    }));

    try {
      // Obtener la ruta desde Mapbox Directions API
      const res = await this.directionsClient.getDirections({
        profile: tipoRuta,
        waypoints,
        geometries: 'geojson'
      }).send();

      if (!res.body.routes || res.body.routes.length === 0) {
        throw new Error('No se pudo calcular una ruta entre los puntos seleccionados');
      }

      const data = res.body.routes[0];
      const distanciaKm = +(data.distance / 1000).toFixed(2);
      const duracionMin = +(data.duration / 60).toFixed(1);

      // Generar imagen estática del mapa SIN la línea de ruta
      const coordenadas = waypoints.map(w => w.coordinates);
      const lons = coordenadas.map(c => c[0]);
      const lats = coordenadas.map(c => c[1]);
      const lonCenter = lons.reduce((a, b) => a + b) / lons.length;
      const latCenter = lats.reduce((a, b) => a + b) / lats.length;

      const imagenUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${lonCenter},${latCenter},13/600x300@2x?access_token=${environment.mapbox_key}`;

      // NUEVO: Calcular la huella de carbono
      const carbonFootprint = this.carbonService.calculateCarbonFootprint(
        distanciaKm,
        tipoRuta,
        1 // Por defecto, un solo pasajero
      );

      // Crear la ruta completa con todos los datos
      const ruta: Ruta = {
        ...rutaParcial,
        tipoRuta,
        fechaCreacion: Timestamp.now(),
        usuarioCreador: this.getUserId() ?? 'desconocido',
        distanciaKm,
        duracionMin,
        imagenUrl,
        carbonFootprint // NUEVO: Incluir datos de huella de carbono
      };

      // Guardar la ruta en Firestore
      const docRef = await addDoc(this.rutasRef, ruta);

      // NUEVO: Log de ruta creada
      await this.auditLog.logRutaCreada(docRef.id, ruta.nombre);

      console.log('Ruta creada con éxito:', ruta.nombre);
    } catch (error) {
      console.error('Error al crear ruta:', error);

      // NUEVO: Log de error
      await this.auditLog.logError('Error al crear ruta', error, 'crearRuta');

      throw error;
    }
  }

  // Método para calcular/actualizar la huella de carbono de una ruta existente
  async calcularHuellaCarbono(rutaId: string, tipoTransporte?: TipoRuta, pasajeros = 1): Promise<CarbonFootprintData | null> {
    try {
      const rutaRef = doc(this.firestore, 'rutas', rutaId);
      const rutaSnap = await getDoc(rutaRef);

      if (!rutaSnap.exists()) {
        console.error('No se encontró la ruta con ID:', rutaId);
        return null;
      }

      const rutaData = rutaSnap.data() as Ruta;

      // Usar el tipo de transporte especificado o el de la ruta
      const transportType = tipoTransporte || rutaData.tipoRuta;

      // Calcular la huella de carbono
      const carbonData = this.carbonService.calculateCarbonFootprint(
        rutaData.distanciaKm,
        transportType,
        pasajeros
      );

      // Actualizar la ruta con los datos de huella de carbono
      await updateDoc(rutaRef, {
        carbonFootprint: carbonData
      });

      // NUEVO: Log de huella calculada
      await this.auditLog.log(
        'Huella de carbono calculada',
        'info',
        { rutaId, tipoTransporte, pasajeros, carbonData },
        rutaId,
        'ruta'
      );

      return carbonData;
    } catch (error) {
      console.error('Error al calcular/actualizar huella de carbono:', error);

      // NUEVO: Log de error
      await this.auditLog.logError('Error al calcular huella', error, 'calcularHuellaCarbono');

      return null;
    }
  }

  // Método para simular huella de carbono sin guardar en la base de datos
  simularHuellaCarbono(distanciaKm: number, tipoTransporte: TipoRuta, pasajeros = 1): CarbonFootprintData {
    return this.carbonService.calculateCarbonFootprint(distanciaKm, tipoTransporte, pasajeros);
  }

  getComparativaTransportes(distanciaKm: number): ComparativaTransporte[] {
    return this.carbonService.getComparisonData(distanciaKm);
  }


  async cargarRutasPorUsuario(usuarioId: string): Promise<Ruta[]> {
    try {
      const q = query(this.rutasRef, where('usuarioCreador', '==', usuarioId));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => this.mapearRuta(doc.id, doc.data() as Omit<Ruta, 'id'>));
    } catch (error) {
      console.error('Error al cargar rutas:', error);

      // NUEVO: Log de error
      await this.auditLog.logError('Error al cargar rutas por usuario', error, 'cargarRutasPorUsuario');

      return [];
    }
  }

  async cargarRutasPublicas(): Promise<Ruta[]> {
    try {
      const q = query(this.rutasRef, where('isPublic', '==', true));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => this.mapearRuta(doc.id, doc.data() as Omit<Ruta, 'id'>));
    } catch (error) {
      console.error('Error al cargar rutas públicas:', error);

      // NUEVO: Log de error
      await this.auditLog.logError('Error al cargar rutas públicas', error, 'cargarRutasPublicas');

      throw error;
    }
  }

  async cargarRutasPublicasPorUsuario(usuarioId: string): Promise<Ruta[]> {
    try {
      const q = query(
        this.rutasRef,
        where('usuarioCreador', '==', usuarioId),
        where('isPublic', '==', true)
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc =>
        this.mapearRuta(doc.id, doc.data() as Omit<Ruta, 'id'>)
      );
    } catch (error) {
      console.error('Error al cargar rutas públicas del usuario:', error);

      // NUEVO: Log de error
      await this.auditLog.logError('Error al cargar rutas públicas por usuario', error, 'cargarRutasPublicasPorUsuario');

      return [];
    }
  }

  async obtenerRutaPorId(id: string): Promise<Ruta | null> {
    try {
      const docRef = doc(this.firestore, `rutas/${id}`);
      const snap = await getDoc(docRef);

      if (!snap.exists()) return null;

      const ruta = this.mapearRuta(snap.id, snap.data() as Omit<Ruta, 'id'>);

      // NUEVO: Log de ruta vista
      await this.auditLog.logRutaVista(id, ruta.nombre);

      return ruta;
    } catch (error) {
      console.error('Error obteniendo ruta por ID:', error);

      // NUEVO: Log de error
      await this.auditLog.logError('Error al obtener ruta por ID', error, 'obtenerRutaPorId');

      return null;
    }
  }

  // Actualizar el método mapearRuta para incluir carbonFootprint
  private mapearRuta(id: string, data: Omit<Ruta, 'id'>): Ruta {
    return {
      id,
      nombre: data.nombre,
      descripcion: data.descripcion || '',
      puntos: (data.puntos || []).map((p: Partial<PuntoLocalizacion>) => ({
        id: p.id ?? '',
        nombre: p.nombre ?? '',
        descripcion: p.descripcion ?? '',
        latitud: p.latitud ?? 0,
        longitud: p.longitud ?? 0,
        fotos: p.fotos || [],
        fechaCreacion: p.fechaCreacion || Timestamp.now(),
        usuarioCreador: p.usuarioCreador || 'desconocido'
      })),
      tipoRuta: data.tipoRuta,
      distanciaKm: data.distanciaKm || 0,
      duracionMin: data.duracionMin || 0,
      fechaCreacion: data.fechaCreacion,
      usuarioCreador: data.usuarioCreador,
      valoracionPromedio: data.valoracionPromedio || 0,
      visitas: data.visitas || 0,
      imagenUrl: data.imagenUrl || '',
      ubicacionInicio: data.ubicacionInicio || '',
      tiempoEstimado: data.tiempoEstimado || '',
      isPublic: data.isPublic || false,
      carbonFootprint: data.carbonFootprint // NUEVO: Incluir carbonFootprint
    };
  }

  async eliminarRutaPorId(id: string): Promise<void> {
    try {
      // Primero obtener el nombre para el log
      const rutaDoc = doc(this.rutasRef, id);
      const rutaSnap = await getDoc(rutaDoc);
      let nombreRuta = 'Ruta desconocida';

      if (rutaSnap.exists()) {
        nombreRuta = rutaSnap.data()['nombre'] || 'Ruta sin nombre';
      }

      await deleteDoc(rutaDoc);

      // NUEVO: Log de ruta eliminada
      await this.auditLog.logRutaEliminada(id, nombreRuta);
    } catch (error) {
      console.error('Error al eliminar ruta:', error);

      // NUEVO: Log de error
      await this.auditLog.logError('Error al eliminar ruta', error, 'eliminarRutaPorId');

      throw error;
    }
  }

  async incrementarVisitas(id: string): Promise<void> {
    try {
      const rutaDoc = doc(this.firestore, `rutas/${id}`);
      const rutaSnap = await getDoc(rutaDoc);

      if (!rutaSnap.exists()) return;

      const visitasActuales = rutaSnap.data()['visitas'] || 0;
      await updateDoc(rutaDoc, { visitas: visitasActuales + 1 });
    } catch (error) {
      console.error('Error al incrementar visitas:', error);

      // NUEVO: Log de error
      await this.auditLog.logError('Error al incrementar visitas', error, 'incrementarVisitas');
    }
  }

  async actualizarValoracion(id: string, nuevaValoracion: number): Promise<void> {
    try {
      const rutaDoc = doc(this.firestore, `rutas/${id}`);
      const rutaSnap = await getDoc(rutaDoc);

      if (!rutaSnap.exists()) return;

      const data = rutaSnap.data();
      const valoracionActual = data['valoracionPromedio'] || 0;
      const visitasActuales = data['visitas'] || 1; // evitar dividir por cero
      const nombreRuta = data['nombre'] || 'Ruta sin nombre';

      const nuevaMedia = ((valoracionActual * (visitasActuales - 1)) + nuevaValoracion) / visitasActuales;

      await updateDoc(rutaDoc, { valoracionPromedio: nuevaMedia });

      // NUEVO: Log de valoración
      await this.auditLog.logRutaValorada(id, nombreRuta, nuevaValoracion);
    } catch (error) {
      console.error('Error al actualizar valoracion:', error);

      // NUEVO: Log de error
      await this.auditLog.logError('Error al actualizar valoración', error, 'actualizarValoracion');
    }
  }
}
