import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  getDocs,
  limit
} from '@angular/fire/firestore';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Usuario } from '../../../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class PerfilService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

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
      fechaRegistro: new Date(),
      rol: 'usuario',
      amigos: []
    };

    await setDoc(docRef, nuevoUsuario);
    return nuevoUsuario;
  }

  // Obtener o crear perfil si no existe
  async obtenerOPrepararPerfil(uid: string): Promise<Usuario> {
    const docRef = doc(this.firestore, `usuarios/${uid}`);
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
      return snapshot.data() as Usuario;
    }

    // Crear perfil por defecto si no existe
    const nuevoPerfil: Usuario = {
      uid,
      nombre: 'Usuario nuevo',
      email: this.auth.currentUser?.email || '',
      fotoUrl: '', // opcional
      biografia: 'Sin biografía aún.',
      fechaRegistro: new Date(),
      rol: 'usuario',
      amigos: []
    };

    await setDoc(docRef, nuevoPerfil);
    return nuevoPerfil;
  }

  // Actualizar perfil
  async actualizarPerfil(usuario: Usuario): Promise<void> {
    const docRef = doc(this.firestore, `usuarios/${usuario.uid}`);
    await setDoc(docRef, usuario, { merge: true });
  }

  // Obtener perfil sin crearlo
  async obtenerPerfil(uid: string): Promise<Usuario | null> {
    const docRef = doc(this.firestore, `usuarios/${uid}`);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? (snapshot.data() as Usuario) : null;
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

  // Añadir amigo
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
  }

  // Eliminar amigo
  async eliminarAmigo(uidActual: string, uidAmigo: string): Promise<void> {
    const perfilActual = await this.obtenerPerfil(uidActual);

    if (!perfilActual || !perfilActual.amigos) {
      throw new Error('No se encontró tu perfil o no tienes amigos');
    }

    // Eliminar amigo
    perfilActual.amigos = perfilActual.amigos.filter(uid => uid !== uidAmigo);

    // Actualizar perfil
    await this.actualizarPerfil(perfilActual);
  }
}
