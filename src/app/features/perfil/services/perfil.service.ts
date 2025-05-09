import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  getDocs,
  limit,
  serverTimestamp
} from '@angular/fire/firestore';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Usuario } from '../../../models/usuario.model';
import { AuthService } from '../../../auth/services/auth.service';

@Injectable({ providedIn: 'root' })
export class PerfilService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private authService: AuthService;

  constructor() {
    this.authService = inject(AuthService);
  }

  // Devuelve el UID del usuario autenticado o null
  getUidActual(): string | null {
    return this.auth.currentUser?.uid || null;
  }

  // Devuelve el UID como promesa (útil en guards/async)
  async getUidActualAsync(): Promise<string | null> {
    return new Promise(resolve => {
      const unsubscribe = onAuthStateChanged(this.auth, user => {
        unsubscribe();
        resolve(user?.uid || null);
      });
    });
  }

  async crearPerfilSiNoExiste(uid: string): Promise<Usuario> {
    const docRef = doc(this.firestore, `usuarios/${uid}`);
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
      return snapshot.data() as Usuario;
    }

    const userAuth = this.auth.currentUser;

    const nuevoUsuario: Usuario = {
      uid,
      nombre: userAuth?.displayName || 'Usuario sin nombre',
      email: userAuth?.email || 'desconocido@correo.com',
      fotoUrl: userAuth?.photoURL || '',
      biografia: '',
      fechaRegistro: serverTimestamp(),
      fechaUltimoLogin: serverTimestamp(),
      emailVerified: userAuth?.emailVerified || false,
      estaActivo: userAuth?.emailVerified || false,
      rol: 'usuario',
      amigos: []
    };

    await setDoc(docRef, nuevoUsuario);
    return nuevoUsuario;
  }

  // Obtener perfil sin crearlo
  async obtenerPerfil(uid: string): Promise<Usuario | null> {
    const docRef = doc(this.firestore, `usuarios/${uid}`);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? (snapshot.data() as Usuario) : null;
  }

  // Actualizar perfil
  async actualizarPerfil(usuario: Usuario): Promise<void> {
    const docRef = doc(this.firestore, `usuarios/${usuario.uid}`);

    // Asegurarse de tener un timestamp para la actualización
    const datosActualizados = {
      ...usuario,
      updatedAt: serverTimestamp()
    };

    await setDoc(docRef, datosActualizados, { merge: true });

    // Si se está actualizando el nombre o la foto, también actualizar en Auth
    if (usuario.nombre || usuario.fotoUrl) {
      try {
        const updates: { displayName?: string, photoURL?: string } = {};
        if (usuario.nombre) updates.displayName = usuario.nombre;
        if (usuario.fotoUrl) updates.photoURL = usuario.fotoUrl;

        await this.authService.updateUserProfile(updates);
      } catch (error) {
        console.warn('No se pudo actualizar el perfil en Auth, pero sí en Firestore', error);
      }
    }
  }

  /**
 * Añade un usuario a la lista de amigos y hace la relación bidireccional
 * @param uidActual UID del usuario actual
 * @param uidAmigo UID del usuario a añadir como amigo
 */
  async agregarAmigo(uidActual: string, uidAmigo: string): Promise<void> {
    const perfilActual = await this.obtenerPerfil(uidActual);

    if (!perfilActual) {
      throw new Error('No se encontró tu perfil');
    }

    // Crear array de amigos si no existe
    if (!perfilActual.amigos) {
      perfilActual.amigos = [];
    }

    // Comprobar si ya es amigo
    if (perfilActual.amigos.includes(uidAmigo)) {
      return; // Ya es amigo, no hace falta hacer nada
    }

    // Añadir amigo
    perfilActual.amigos.push(uidAmigo);

    // Actualizar perfil
    await this.actualizarPerfil(perfilActual);

    // También actualizar el perfil del amigo para que sea bidireccional
    const perfilAmigo = await this.obtenerPerfil(uidAmigo);
    if (perfilAmigo) {
      if (!perfilAmigo.amigos) {
        perfilAmigo.amigos = [];
      }

      if (!perfilAmigo.amigos.includes(uidActual)) {
        perfilAmigo.amigos.push(uidActual);
        await this.actualizarPerfil(perfilAmigo);
      }
    }
  }

  // Eliminar perfil
  async eliminarPerfil(uid: string): Promise<void> {
    // Eliminar el documento principal del usuario
    const userRef = doc(this.firestore, `usuarios/${uid}`);
    await deleteDoc(userRef);

    // Nota: La eliminación completa de datos relacionados (amigos, etc.)
    // debe implementarse según tus necesidades específicas
  }

  // Búsqueda de usuarios por nombre o email
  async buscarUsuarios(termino: string): Promise<Usuario[]> {
    if (!termino || termino.length < 2) return [];

    const terminoLower = termino.toLowerCase();
    const usuarios: Usuario[] = [];

    try {
      const queryRef = collection(this.firestore, 'usuarios');
      const snapshot = await getDocs(query(queryRef, limit(50)));

      snapshot.forEach(doc => {
        const user = doc.data() as Usuario;
        const nombreMatch = user.nombre?.toLowerCase().includes(terminoLower);
        const emailMatch = user.email?.toLowerCase().includes(terminoLower);

        if (nombreMatch || emailMatch) {
          usuarios.push(user);
        }
      });

      return usuarios.sort((a, b) => a.nombre.localeCompare(b.nombre));
    } catch (err) {
      console.error('Error en búsqueda de usuarios:', err);
      return [];
    }
  }

  // Obtener varios perfiles por sus UIDs (útil para cargar amigos)
  async obtenerVariosPerfiles(uids: string[]): Promise<Usuario[]> {
    if (!uids || uids.length === 0) {
      return [];
    }

    const perfiles: Usuario[] = [];

    // Limitar a un máximo de 50 perfiles por consulta para evitar problemas de rendimiento
    const uidsLimitados = uids.slice(0, 50);

    for (const uid of uidsLimitados) {
      const perfil = await this.obtenerPerfil(uid);
      if (perfil) {
        perfiles.push(perfil);
      }
    }

    return perfiles;
  }

  // Obtener snapshot del perfil actual (para saber si es admin)
  async getUserProfileSnapshot(): Promise<Usuario | null> {
    const userId = this.getUidActual();
    if (!userId) return null;

    try {
      const userRef = doc(this.firestore, `usuarios/${userId}`);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        return userDoc.data() as Usuario;
      }
      return null;
    } catch (error) {
      console.error('Error al obtener perfil de usuario:', error);
      return null;
    }
  }
}
