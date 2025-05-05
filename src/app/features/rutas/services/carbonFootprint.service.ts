import { Injectable } from '@angular/core';

export interface CarbonFootprintData {
  totalEmission: number;       // en kg de CO2
  transportType: string;       // tipo de transporte usado
  equivalentActivities: {      // actividades equivalentes
    treeDays: number;
    lightBulbHours: number;
    meatMeals: number;
  };
  recommendations: string[];   // recomendaciones personalizadas
  potentialSavings?: {         // potencial de ahorro con otros medios
    [key: string]: number;     // tipo de transporte -> kg CO2 ahorrados
  }
}

@Injectable({
  providedIn: 'root'
})
export class CarbonFootprintService {
  // Factores de emisión en kg CO2 por kilómetro por persona
  private emissionFactors = {
    'walking': 0,                    // caminar - sin emisiones directas
    'cycling': 0,                    // bicicleta - sin emisiones directas
    'driving': 0.171,                // coche medio diésel
    'driving-electric': 0.053,       // coche eléctrico pequeño
    'bus': 0.105,                    // autobús urbano
    'train': 0.035,                  // tren
    'motorcycle': 0.103              // motocicleta
  };

  // Nombres en español
  private transportTypeNames = {
    'walking': 'A pie',
    'cycling': 'En bicicleta',
    'driving': 'En coche',
    'driving-electric': 'En coche eléctrico',
    'bus': 'En autobús',
    'train': 'En tren',
    'motorcycle': 'En motocicleta'
  };

  constructor() { }

  /**
   * Calcula la huella de carbono de una ruta
   * @param distanceKm Distancia en kilómetros
   * @param transportType Tipo de transporte (debe coincidir con una clave de emissionFactors)
   * @param passengers Número de pasajeros (para cálculos de coche compartido)
   * @returns Datos detallados de huella de carbono
   */
  calculateCarbonFootprint(distanceKm: number, transportType: string, passengers: number = 1): CarbonFootprintData {
    // Obtener el tipo de transporte normalizado
    let normalizedType = this.normalizeTransportType(transportType);

    // Si el tipo no existe, usar el predeterminado (driving)
    if (!(normalizedType in this.emissionFactors)) {
      normalizedType = 'driving';
    }

    // Calcular la emisión base
    let emissionFactor = this.emissionFactors[normalizedType as keyof typeof this.emissionFactors];

    // Ajustar para coches compartidos
    if (normalizedType === 'driving' || normalizedType === 'driving-electric') {
      if (passengers > 1) {
        emissionFactor = emissionFactor / passengers;
      }
    }

    // Calcular la emisión total
    const totalEmission = emissionFactor * distanceKm;

    // Calcular equivalencias
    const equivalentActivities = {
      // Un árbol absorbe aproximadamente 22 kg de CO2 al año
      treeDays: Math.round((totalEmission / 22) * 365),

      // Una bombilla LED de 10W emite aproximadamente 0.005 kg CO2 por hora
      lightBulbHours: Math.round(totalEmission / 0.005),

      // Una comida con carne de res emite aproximadamente 6.5 kg CO2
      meatMeals: Math.round(totalEmission / 6.5)
    };

    // Generar recomendaciones personalizadas
    const recommendations = this.generateRecommendations(normalizedType, distanceKm);

    // Calcular potencial de ahorro con otros medios
    const potentialSavings = this.calculatePotentialSavings(normalizedType, distanceKm, passengers);

    return {
      totalEmission,
      transportType: this.transportTypeNames[normalizedType as keyof typeof this.transportTypeNames] || normalizedType,
      equivalentActivities,
      recommendations,
      potentialSavings
    };
  }

  /**
   * Normaliza el tipo de transporte para que coincida con nuestras claves
   */
  private normalizeTransportType(type: string): string {
    // Normalizar los tipos proporcionados por Mapbox
    switch (type) {
      case 'walking': return 'walking';
      case 'cycling': return 'cycling';
      case 'driving': return 'driving';
      case 'driving-electric': return 'driving-electric';
      case 'bus': return 'bus';
      case 'train': return 'train';
      case 'motorcycle': return 'motorcycle';
      default: return 'driving'; // Valor predeterminado
    }
  }

  /**
   * Genera recomendaciones basadas en el tipo de transporte y distancia
   */
  private generateRecommendations(transportType: string, distanceKm: number): string[] {
    const recommendations: string[] = [];

    // Recomendaciones para distancias cortas (< 5 km)
    if (distanceKm < 5) {
      if (transportType !== 'walking' && transportType !== 'cycling') {
        recommendations.push('Para distancias cortas, considera caminar o usar bicicleta para reducir emisiones a cero.');
      }
    }
    // Recomendaciones para distancias medias (5-20 km)
    else if (distanceKm >= 5 && distanceKm < 20) {
      if (transportType === 'driving') {
        recommendations.push('Para esta distancia, el transporte público o bicicleta eléctrica reducirían significativamente tu huella de carbono.');
      }
    }
    // Recomendaciones para distancias largas (>20 km)
    else {
      if (transportType === 'driving') {
        recommendations.push('Para viajes largos, considera el transporte público como trenes o autobuses para reducir emisiones.');
      }
    }

    // Recomendaciones específicas por tipo de transporte
    if (transportType === 'driving') {
      recommendations.push('Compartir el viaje con más personas reduce significativamente la huella de carbono por persona.');
      recommendations.push('Una conducción eficiente (velocidad constante, aceleraciones suaves) puede reducir el consumo hasta un 20%.');
    }

    // Asegurarse de que siempre hay al menos una recomendación
    if (recommendations.length === 0) {
      if (transportType === 'walking' || transportType === 'cycling') {
        recommendations.push('¡Excelente elección! Continúa usando este método de transporte sostenible.');
      } else {
        recommendations.push('Considera alternativas de transporte más sostenibles cuando sea posible.');
      }
    }

    return recommendations;
  }

  /**
   * Calcula el ahorro potencial comparado con otros medios de transporte
   */
  private calculatePotentialSavings(transportType: string, distanceKm: number, passengers: number): {[key: string]: number} {
    const currentEmission = this.emissionFactors[transportType as keyof typeof this.emissionFactors] * distanceKm /
      ((transportType === 'driving' || transportType === 'driving-electric') && passengers > 1 ? passengers : 1);

    const savings: {[key: string]: number} = {};

    // Tipos de transporte a comparar según la distancia
    let comparisonTypes: string[] = [];

    if (distanceKm < 5) {
      comparisonTypes = ['walking', 'cycling', 'driving', 'bus'];
    } else if (distanceKm < 20) {
      comparisonTypes = ['cycling', 'driving', 'driving-electric', 'bus', 'train'];
    } else {
      comparisonTypes = ['driving', 'driving-electric', 'bus', 'train'];
    }

    // Eliminar el tipo actual de la comparación
    comparisonTypes = comparisonTypes.filter(type => type !== transportType);

    // Calcular ahorros para cada tipo
    for (const type of comparisonTypes) {
      const typeEmission = this.emissionFactors[type as keyof typeof this.emissionFactors] * distanceKm;
      const saving = currentEmission - typeEmission;

      // Solo incluir si hay un ahorro significativo
      if (saving > 0.01) {
        savings[this.transportTypeNames[type as keyof typeof this.transportTypeNames]] = Number(saving.toFixed(2));
      }
    }

    return savings;
  }

  /**
   * Obtiene la clase CSS según el nivel de emisiones
   */
  getEmissionLevelClass(footprint: number): string {
    if (footprint === 0) return 'eco-zero';
    if (footprint < 0.5) return 'eco-low';
    if (footprint < 2) return 'eco-medium';
    return 'eco-high';
  }

  /**
   * Obtiene una etiqueta descriptiva según el nivel de emisiones
   */
  getEmissionLevelLabel(footprint: number): string {
    if (footprint === 0) return 'Cero emisiones';
    if (footprint < 0.5) return 'Impacto bajo';
    if (footprint < 2) return 'Impacto moderado';
    return 'Impacto alto';
  }

  /**
   * Obtiene datos de comparación para mostrar en la interfaz
   */
  getComparisonData(distanceKm: number): { type: string, emission: number, label: string, class: string }[] {
    const types = ['walking', 'cycling', 'driving', 'bus', 'train'];

    return types.map(type => {
      const emission = this.emissionFactors[type as keyof typeof this.emissionFactors] * distanceKm;
      return {
        type: this.transportTypeNames[type as keyof typeof this.transportTypeNames],
        emission: Number(emission.toFixed(2)),
        label: this.getEmissionLevelLabel(emission),
        class: this.getEmissionLevelClass(emission)
      };
    }).sort((a, b) => a.emission - b.emission);
  }
}
