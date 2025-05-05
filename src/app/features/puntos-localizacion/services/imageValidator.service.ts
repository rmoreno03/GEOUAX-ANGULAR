import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable, from, map, mergeMap, of, catchError } from 'rxjs';

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  etiquetasDetectadas?: string[];
  tipoDeteccion?: 'safeSearch' | 'etiquetaProhibida';
}

interface VisionAPIResponse {
  responses: {
    safeSearchAnnotation?: {
      adult?: string;
      violence?: string;
      racy?: string;
    };
    labelAnnotations?: { description: string }[];
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class ImageValidationService {
  constructor(private http: HttpClient) {}

  // valida imagen con Vision API (SafeSearch + etiquetas)
  validateImage(file: File): Observable<ValidationResult> {
    if (file.size > 4 * 1024 * 1024) {
      console.warn('Imagen demasiado grande:', file.size);
      return of({
        isValid: false,
        reason: 'La imagen es demasiado grande (máximo 4MB)'
      });
    }

    return from(this.fileToBase64(file)).pipe(
      mergeMap(base64Image => {
        try {
          const parts = base64Image.split(',');
          if (parts.length !== 2) throw new Error('base64 mal formado');
          const base64Content = parts[1];

          const requestBody = {
            requests: [
              {
                image: { content: base64Content },
                features: [
                  { type: 'SAFE_SEARCH_DETECTION', maxResults: 1 },
                  { type: 'LABEL_DETECTION', maxResults: 10 }
                ]
              }
            ]
          };

          const apiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${environment.google_vision_api_key}`;

          return this.http.post<VisionAPIResponse>(apiUrl, requestBody).pipe(
            catchError((error: HttpErrorResponse) => {
              console.error('Fallo llamando a Vision API:', error);
              return of(null); // devolvemos null para evitar procesar
            }),
            map(response => {
              if (!response) {
                return {
                  isValid: false,
                  reason: 'Error en la validación con la API'
                };
              }
              return this.procesarRespuesta(response);
            })
          );
        } catch (error) {
          console.error('Error preparando la petición:', error);
          return of({
            isValid: false,
            reason: 'Error interno validando la imagen'
          });
        }
      })
    );
  }

  // analiza lo que devuelve la API
  private procesarRespuesta(response: VisionAPIResponse): ValidationResult {
    const safeSearch = response.responses?.[0]?.safeSearchAnnotation;
    const labels = response.responses?.[0]?.labelAnnotations || [];

    const etiquetasDetectadas = labels.map((l: { description: string }) =>
      l.description.toLowerCase()
    );

    console.log('SafeSearch:', safeSearch);
    console.log('Etiquetas detectadas:', etiquetasDetectadas);

    if (
      safeSearch?.adult === 'LIKELY' || safeSearch?.adult === 'VERY_LIKELY' ||
      safeSearch?.violence === 'LIKELY' || safeSearch?.violence === 'VERY_LIKELY' ||
      safeSearch?.racy === 'VERY_LIKELY'
    ) {
      return {
        isValid: false,
        reason: 'La imagen contiene contenido explícito o violento',
        tipoDeteccion: 'safeSearch',
        etiquetasDetectadas
      };
    }

    const etiquetasProhibidas = [
      'gun', 'weapon', 'firearm', 'pistol', 'revolver', 'rifle', 'shotgun', 'handgun', 'sniper rifle', 'machine gun',
      'knife', 'blade', 'dagger', 'machete',
      'bomb', 'grenade', 'explosive', 'missile', 'rocket launcher', 'land mine',
      'bullet', 'ammunition', 'cartridge', 'shell',
      'drugs', 'narcotic', 'cocaine', 'heroin', 'marijuana', 'syringe', 'needle', 'pill', 'opioid',
      'nude', 'nudity', 'porn', 'erotic', 'underwear', 'lingerie', 'sex toy', 'condom', 'adult toy',
      'blood', 'wound', 'corpse', 'dead body', 'murder', 'execution', 'suicide', 'self harm', 'cutting'
    ];

    const contieneEtiquetaProhibida = etiquetasProhibidas.some(tag =>
      etiquetasDetectadas.includes(tag)
    );

    if (contieneEtiquetaProhibida) {
      return {
        isValid: false,
        reason: 'Se detectó un objeto o contenido no permitido en la imagen',
        tipoDeteccion: 'etiquetaProhibida',
        etiquetasDetectadas
      };
    }

    return {
      isValid: true,
      etiquetasDetectadas
    };
  }

  // convierte la imagen a base64 para la API
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (reader.result && typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Error al convertir a base64'));
        }
      };

      reader.onerror = error => {
        console.error('Error en FileReader:', error);
        reject(error);
      };

      reader.readAsDataURL(file);
    });
  }
}
