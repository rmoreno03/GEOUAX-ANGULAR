import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  deleteDoc,
  setDoc,
  Timestamp,
  QueryConstraint,
  serverTimestamp,
  FieldValue
} from '@angular/fire/firestore';
import { AuthService } from '../../../auth/services/auth.service';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { Usuario } from '../../../models/usuario.model';

export interface UserFilter {
  rol?: string;
  activo?: boolean;
  busqueda?: string;
  campo?: 'nombre' | 'email' | 'rol';
}

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  private readonly COLLECTION_NAME = 'usuarios';

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private auditLog: AuditLogService
  ) {}

  /**
   * Obtiene todos los usuarios con opciones de filtrado
   */
  async getUsers(filters?: UserFilter): Promise<Usuario[]> {
    try {
      const usersCollection = collection(this.firestore, this.COLLECTION_NAME);

      // Construir query con filtros si existen
      const queryConstraints: QueryConstraint[] = [];

      if (filters?.rol) {
        queryConstraints.push(where('rol', '==', filters.rol));
      }

      if (filters?.activo !== undefined) {
        queryConstraints.push(where('estaActivo', '==', filters.activo));
      }

      // Siempre ordenar por fecha de registro (más reciente primero)
      queryConstraints.push(orderBy('fechaRegistro', 'desc'));

      const q = query(usersCollection, ...queryConstraints);
      const snapshot = await getDocs(q);

      let users = snapshot.docs.map(doc => {
        const userData = doc.data();
        return {
          ...userData,
          uid: doc.id
        } as Usuario;
      });

      // Búsqueda adicional en memoria si se especifica
      if (filters?.busqueda && filters?.campo) {
        const termino = filters.busqueda.toLowerCase();
        users = users.filter(user => {
          switch (filters.campo) {
            case 'nombre':
              return user.nombre?.toLowerCase().includes(termino);
            case 'email':
              return user.email.toLowerCase().includes(termino);
            case 'rol':
              return user.rol?.toLowerCase().includes(termino);
            default:
              return true;
          }
        });
      }

      // Log de consulta exitosa
      await this.auditLog.log(
        'Consulta de usuarios',
        'info',
        { filtros: filters, cantidad: users.length },
        undefined,
        'sistema'
      );

      return users;
    } catch (error) {
      console.error('Error al obtener usuarios:', error);

      // Log de error
      await this.auditLog.logError('Error al obtener usuarios', error, 'getUsers');

      throw error;
    }
  }

  /**
   * Obtiene un usuario por su ID
   */
  async getUserById(uid: string): Promise<Usuario | null> {
    try {
      const userDoc = doc(this.firestore, `${this.COLLECTION_NAME}/${uid}`);
      const snapshot = await getDoc(userDoc);

      if (!snapshot.exists()) {
        return null;
      }

      const userData = snapshot.data();

      // Log de consulta exitosa
      await this.auditLog.log(
        'Consulta de usuario por ID',
        'info',
        { uid },
        uid,
        'usuario'
      );

      return { ...userData, uid: snapshot.id } as Usuario;
    } catch (error) {
      console.error('Error al obtener usuario por ID:', error);

      // Log de error
      await this.auditLog.logError('Error al obtener usuario por ID', error, 'getUserById');

      throw error;
    }
  }

  /**
   * Actualiza un usuario existente
   */
  async updateUser(uid: string, updates: Partial<Usuario>): Promise<void> {
    try {
      // Obtener datos actuales para comparación y logs
      const currentData = await this.getUserById(uid);
      if (!currentData) {
        throw new Error('Usuario no encontrado');
      }

      // Preparar datos para actualización
      const updateData = { ...updates };

      // Asegurar que el timestamp se actualice
      if (!updateData.updatedAt) {
        updateData.updatedAt = serverTimestamp();
      }

      const userDoc = doc(this.firestore, `${this.COLLECTION_NAME}/${uid}`);
      await updateDoc(userDoc, updateData);

      // Determinar qué campos han cambiado para el log
      const changedFields = Object.keys(updates).filter(key =>
        JSON.stringify(updates[key as keyof Usuario]) !==
        JSON.stringify(currentData[key as keyof Usuario])
      );

      // Log de actualización
      await this.auditLog.log(
        'Usuario actualizado',
        'info',
        {
          uid,
          campos: changedFields,
          nombre: currentData.nombre,
          email: currentData.email
        },
        uid,
        'usuario'
      );
    } catch (error) {
      console.error('Error al actualizar usuario:', error);

      // Log de error
      await this.auditLog.logError('Error al actualizar usuario', error, 'updateUser');

      throw error;
    }
  }

  /**
   * Desactiva o activa un usuario
   */
  async toggleUserStatus(uid: string, activate: boolean): Promise<void> {
    try {
      const userDoc = doc(this.firestore, `${this.COLLECTION_NAME}/${uid}`);

      // Obtener datos actuales para el log
      const userData = await this.getUserById(uid);

      await updateDoc(userDoc, {
        estaActivo: activate,
        updatedAt: serverTimestamp()
      });

      // Log de cambio de estado
      const accion = activate ? 'activado' : 'desactivado';
      await this.auditLog.log(
        `Usuario ${accion}`,
        activate ? 'info' : 'warning',
        {
          uid,
          nombre: userData?.nombre,
          email: userData?.email,
          nuevoEstado: activate
        },
        uid,
        'usuario'
      );
    } catch (error) {
      console.error('Error al cambiar estado de usuario:', error);

      // Log de error
      await this.auditLog.logError('Error al cambiar estado de usuario', error, 'toggleUserStatus');

      throw error;
    }
  }

  /**
   * Actualiza el rol de un usuario
   */
  async updateUserRole(uid: string, newRole: string): Promise<void> {
    try {
      const userDoc = doc(this.firestore, `${this.COLLECTION_NAME}/${uid}`);

      // Obtener datos actuales para el log
      const userData = await this.getUserById(uid);
      const oldRole = userData?.rol || 'usuario';

      await updateDoc(userDoc, {
        rol: newRole,
        updatedAt: serverTimestamp()
      });

      // Log de cambio de rol
      await this.auditLog.log(
        'Rol de usuario actualizado',
        'warning',
        {
          uid,
          nombre: userData?.nombre,
          email: userData?.email,
          rolAnterior: oldRole,
          rolNuevo: newRole
        },
        uid,
        'usuario'
      );
    } catch (error) {
      console.error('Error al actualizar rol de usuario:', error);

      // Log de error
      await this.auditLog.logError('Error al actualizar rol de usuario', error, 'updateUserRole');

      throw error;
    }
  }

  /**
   * Obtiene las estadísticas de un usuario
   */
  async getUserStatistics(uid: string): Promise<any> {
    try {
      // Contar rutas creadas
      const rutasRef = collection(this.firestore, 'rutas');
      const rutasQuery = query(rutasRef, where('usuarioCreador', '==', uid));
      const rutasSnapshot = await getDocs(rutasQuery);
      const totalRutas = rutasSnapshot.size;

      // Contar puntos creados
      const puntosRef = collection(this.firestore, 'puntos_localizacion');
      const puntosQuery = query(puntosRef, where('usuarioCreador', '==', uid));
      const puntosSnapshot = await getDocs(puntosQuery);
      const totalPuntos = puntosSnapshot.size;

      // Contar rutas completadas
      const progresoRef = collection(this.firestore, 'progreso-rutas');
      const progresoQuery = query(
        progresoRef,
        where('usuarioId', '==', uid),
        where('completado', '==', true)
      );
      const progresoSnapshot = await getDocs(progresoQuery);
      const rutasCompletadas = progresoSnapshot.size;

      // Estadísticas
      const stats: {
        totalRutas: number;
        totalPuntos: number;
        rutasCompletadas: number;
        ultimaConexion: Date | Timestamp | FieldValue | null;
      } = {
        totalRutas,
        totalPuntos,
        rutasCompletadas,
        ultimaConexion: null
      };


      // Obtener fecha de último acceso
      const userData = await this.getUserById(uid);
      if (userData) {
        stats.ultimaConexion = userData.fechaUltimoLogin ?? userData.ultimaConexion ?? null;
      }

      // Log de consulta de estadísticas
      await this.auditLog.log(
        'Consulta de estadísticas de usuario',
        'info',
        {
          uid,
          nombre: userData?.nombre,
          email: userData?.email,
          stats
        },
        uid,
        'usuario'
      );

      return stats;
    } catch (error) {
      console.error('Error al obtener estadísticas de usuario:', error);

      // Log de error
      await this.auditLog.logError('Error al obtener estadísticas de usuario', error, 'getUserStatistics');

      throw error;
    }
  }

  /**
   * Elimina un usuario de manera segura
   * Solo para uso administrativo - no elimina la cuenta de autenticación
   */
  async deleteUserData(uid: string): Promise<void> {
    try {
      // Obtener datos actuales para el log
      const userData = await this.getUserById(uid);

      // Eliminar el documento del usuario
      const userDoc = doc(this.firestore, `${this.COLLECTION_NAME}/${uid}`);
      await deleteDoc(userDoc);

      // Log de eliminación
      await this.auditLog.log(
        'Datos de usuario eliminados',
        'error', // Nivel alto para indicar una acción crítica
        {
          uid,
          nombre: userData?.nombre,
          email: userData?.email
        },
        uid,
        'usuario'
      );
    } catch (error) {
      console.error('Error al eliminar datos de usuario:', error);

      // Log de error
      await this.auditLog.logError('Error al eliminar datos de usuario', error, 'deleteUserData');

      throw error;
    }
  }

  /**
   * Exporta todos los usuarios a un formato CSV
   */
  async exportUsersToCSV(): Promise<string> {
    try {
      // Obtener todos los usuarios
      const users = await this.getUsers();

      // Crear cabeceras
      const headers = [
        'ID',
        'Nombre',
        'Email',
        'Rol',
        'Estado',
        'Fecha Registro',
        'Último Acceso'
      ];

      // Crear filas
      const rows = users.map(user => [
        user.uid,
        user.nombre || 'Sin nombre',
        user.email,
        user.rol || 'Usuario',
        user.estaActivo ? 'Activo' : 'Inactivo',
        this.formatDate(user.fechaRegistro),
        this.formatDate(user.fechaUltimoLogin || user.ultimaConexion)
      ]);

      // Unir todo en formato CSV
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      // Log de exportación
      await this.auditLog.log(
        'Exportación de usuarios a CSV',
        'info',
        { totalUsuarios: users.length },
        undefined,
        'sistema'
      );

      return csvContent;
    } catch (error) {
      console.error('Error al exportar usuarios a CSV:', error);

      // Log de error
      await this.auditLog.logError('Error al exportar usuarios a CSV', error, 'exportUsersToCSV');

      throw error;
    }
  }

  /**
   * Formato de fecha para exportación
   */
  private formatDate(date: any): string {
    if (!date) return 'N/A';

    try {
      // Convertir Timestamp de Firestore a Date si es necesario
      const dateObj = date instanceof Timestamp ? date.toDate() : new Date(date);

      return dateObj.toISOString().split('T')[0];
    } catch (error) {
      return 'Fecha inválida';
    }
  }
}
