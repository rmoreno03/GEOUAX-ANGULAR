import { Injectable, inject } from '@angular/core';
import {
  Storage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
} from '@angular/fire/storage';

@Injectable({
  providedIn: 'root'
})
export class SubirArchivosService {
  private storage = inject(Storage);

  /**
   * Sube un archivo a Firebase Storage
   * @param ruta Ruta donde guardar el archivo (sin extensión)
   * @param archivo Archivo a subir
   * @returns URL de descarga del archivo
   */
  async subirArchivo(ruta: string, archivo: File): Promise<string> {
    try {
      // Obtener extensión del archivo
      const extension = this.obtenerExtension(archivo.name);

      // Nombre del archivo: timestamp + extensión
      const nombreArchivo = `${Date.now()}.${extension}`;

      // Referencia completa: ruta + nombre
      const rutaCompleta = `${ruta}/${nombreArchivo}`;
      const storageRef = ref(this.storage, rutaCompleta);

      // Subir archivo con barra de progreso
      const subida = uploadBytesResumable(storageRef, archivo);

      // Esperar a que se complete la subida
      return new Promise((resolve, reject) => {
        subida.on(
          'state_changed',
          // Progreso
          (snapshot) => {
            const progreso = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Progreso: ${progreso.toFixed(2)}%`);
          },
          // Error
          (error) => {
            console.error('Error al subir archivo:', error);
            reject(error);
          },
          // Completado
          async () => {
            // Obtener URL de descarga
            const downloadURL = await getDownloadURL(subida.snapshot.ref);
            resolve(downloadURL);
          }
        );
      });
    } catch (error) {
      console.error('Error en la subida:', error);
      throw error;
    }
  }

  /**
   * Elimina un archivo de Firebase Storage
   * @param url URL del archivo a eliminar
   */
  async eliminarArchivo(url: string): Promise<void> {
    try {
      // Obtener referencia del archivo a partir de la URL
      const storageRef = ref(this.storage, url);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error al eliminar archivo:', error);
      throw error;
    }
  }

  /**
   * Extrae la extensión de un nombre de archivo
   * @param nombreArchivo Nombre del archivo con extensión
   * @returns Extensión sin el punto
   */
  private obtenerExtension(nombreArchivo: string): string {
    return nombreArchivo.split('.').pop()?.toLowerCase() || 'png';
  }

  /**
   * Valida que el archivo sea una imagen y no exceda el tamaño máximo
   * @param archivo Archivo a validar
   * @param tamanoMaximoMB Tamaño máximo en MB
   * @returns Objeto con validez y mensaje de error
   */
  validarImagen(archivo: File, tamanoMaximoMB: number = 2): { valido: boolean, mensaje?: string } {
    // Validar que sea una imagen
    if (!archivo.type.startsWith('image/')) {
      return {
        valido: false,
        mensaje: 'El archivo debe ser una imagen (jpg, png, gif, etc.)'
      };
    }

    // Validar tamaño máximo
    const tamanoMaximoBytes = tamanoMaximoMB * 1024 * 1024;
    if (archivo.size > tamanoMaximoBytes) {
      return {
        valido: false,
        mensaje: `La imagen no debe superar los ${tamanoMaximoMB} MB`
      };
    }

    return { valido: true };
  }

  /**
   * Genera una vista previa de una imagen
   * @param archivo Archivo de imagen
   * @returns Promise con la URL de datos de la vista previa
   */
  async generarVistaPrevia(archivo: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        resolve(reader.result as string);
      };

      reader.onerror = () => {
        reject('Error al generar vista previa');
      };

      reader.readAsDataURL(archivo);
    });
  }
}
