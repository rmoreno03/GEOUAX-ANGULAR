// ruta.model.ts

import { PuntoLocalizacion } from './punto-localizacion.model';
import { Timestamp } from '@angular/fire/firestore';

// Define el tipo literal para tipoRuta
export type TipoRuta = 'driving' | 'walking' | 'cycling';

// Tipos de geometría compatibles con GeoJSON
export type GeoJSONGeometryType =
  | 'Point'
  | 'LineString'
  | 'MultiPoint'
  | 'Polygon'
  | 'MultiLineString'
  | 'MultiPolygon'
  | 'GeometryCollection';

// Interfaz para la geometría de GeoJSON
export interface GeoJSONGeometry {
  type: GeoJSONGeometryType;
  coordinates: number[] | number[][] | number[][][] | number[][][][];
}

// Interfaz específica para LineString (lo que devuelve la API de rutas)
export interface LineStringGeometry {
  type: 'LineString';
  coordinates: number[][];
}

// Datos de huella de carbono
export interface CarbonFootprintData {
  totalEmission: number;       // en kg de CO2
  transportType: string;       // tipo de transporte usado
  equivalentActivities: {      // actividades equivalentes
    treeDays: number;
    lightBulbHours: number;
    meatMeals: number;
  };
  recommendations: string[];   // recomendaciones personalizadas
  potentialSavings?: Record<string, number>
}

export interface Ruta {
  id?: string;
  nombre: string;
  descripcion?: string;
  puntos: PuntoLocalizacion[];
  tipoRuta: TipoRuta;
  distanciaKm: number;
  duracionMin: number;
  fechaCreacion: Timestamp;
  usuarioCreador: string;
  valoracionPromedio?: number;
  visitas?: number;
  imagenUrl?: string;
  ubicacionInicio?: string;
  tiempoEstimado?: string;
  isPublic?: boolean;
  carbonFootprint?: CarbonFootprintData;
}


// Tipos útiles para el componente ver-todas
export interface RutaExtendida extends Ruta {
  center: mapboxgl.LngLatBounds;
  popupInfo: {
    distancia: string;
    duracion: string;
  };
  sourceId: string;
  layerId: string;
  markersIds: string[];
}

// Extiende RutaExtendida para incluir la geometría
export interface RutaExtendidaConGeometria extends RutaExtendida {
  geometry: LineStringGeometry;
}


