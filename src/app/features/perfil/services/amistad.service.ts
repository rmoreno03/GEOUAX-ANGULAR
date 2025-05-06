import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  deleteDoc
} from '@angular/fire/firestore';

import { SolicitudAmistad } from '../../../models/solicitud-amistad.model';
import { PerfilService } from './perfil.service';

@Injectable({ providedIn: 'root' })
export class AmistadService {
  private firestore = inject(Firestore);
  private perfilService = inject(PerfilService);

  // Colección de solicitudes
  private get solicitudesCollection() {
    return collection(this.firestore, 'solicitudes_amistad');
  }

  // Enviar solicitud de amistad
  async enviarSolicitudAmistad(uidSolicitante: string, uidReceptor: string): Promise<string> {
    // Verificar que no exista ya una solicitud pendiente
    const solicitudExistente = await this.obtenerSolicitudEntrePorEstado(
      uidSolicitante,
      uidReceptor,
      'pendiente'
    );

    if (solicitudExistente) {
      throw new Error('Ya existe una solicitud de amistad pendiente');
    }

    // Verificar que no sean ya amigos
    const perfilSolicitante = await this.perfilService.obtenerPerfil(uidSolicitante);
    if (perfilSolicitante?.amigos?.includes(uidReceptor)) {
      throw new Error('Ya son amigos');
    }

    // Crear la solicitud
    const nuevaSolicitud: SolicitudAmistad = {
      uidSolicitante,
      uidReceptor,
      estado: 'pendiente',
      fechaSolicitud: new Date(),
      notificado: false
    };

    // Guardar en Firestore
    const docRef = await addDoc(this.solicitudesCollection, nuevaSolicitud);
    return docRef.id;
  }

  // Aceptar solicitud de amistad
  async aceptarSolicitudAmistad(idSolicitud: string): Promise<void> {
    const solicitudRef = doc(this.firestore, `solicitudes_amistad/${idSolicitud}`);
    const snapshot = await getDoc(solicitudRef);

    if (!snapshot.exists()) {
      throw new Error('La solicitud no existe');
    }

    const solicitud = snapshot.data() as SolicitudAmistad;

    if (solicitud.estado !== 'pendiente') {
      throw new Error('La solicitud ya no está pendiente');
    }

    // Actualizar estado de la solicitud
    await updateDoc(solicitudRef, {
      estado: 'aceptada',
      fechaRespuesta: new Date()
    });

    // Añadir a ambos usuarios como amigos
    await this.perfilService.agregarAmigo(solicitud.uidReceptor, solicitud.uidSolicitante);
    await this.perfilService.agregarAmigo(solicitud.uidSolicitante, solicitud.uidReceptor);
  }

  // Rechazar solicitud de amistad
  async rechazarSolicitudAmistad(idSolicitud: string): Promise<void> {
    const solicitudRef = doc(this.firestore, `solicitudes_amistad/${idSolicitud}`);
    const snapshot = await getDoc(solicitudRef);

    if (!snapshot.exists()) {
      throw new Error('La solicitud no existe');
    }

    // Actualizar estado de la solicitud
    await updateDoc(solicitudRef, {
      estado: 'rechazada',
      fechaRespuesta: new Date()
    });
  }

  // Cancelar solicitud de amistad (por el solicitante)
  async cancelarSolicitudAmistad(idSolicitud: string): Promise<void> {
    const solicitudRef = doc(this.firestore, `solicitudes_amistad/${idSolicitud}`);
    const snapshot = await getDoc(solicitudRef);

    if (!snapshot.exists()) {
      throw new Error('La solicitud no existe');
    }

    // Actualizar estado de la solicitud
    await updateDoc(solicitudRef, {
      estado: 'cancelada',
      fechaRespuesta: new Date()
    });
  }

  // Obtener solicitud por ID
  async obtenerSolicitud(idSolicitud: string): Promise<SolicitudAmistad | null> {
    const solicitudRef = doc(this.firestore, `solicitudes_amistad/${idSolicitud}`);
    const snapshot = await getDoc(solicitudRef);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();
    return {
      id: snapshot.id,
      ...data
    } as SolicitudAmistad;
  }

  // Obtener solicitud entre dos usuarios por estado
  async obtenerSolicitudEntrePorEstado(
    uid1: string,
    uid2: string,
    estado: 'pendiente' | 'aceptada' | 'rechazada' | 'cancelada'
  ): Promise<SolicitudAmistad | null> {
    // Buscar solicitud donde uid1 es solicitante y uid2 es receptor
    const q1 = query(
      this.solicitudesCollection,
      where('uidSolicitante', '==', uid1),
      where('uidReceptor', '==', uid2),
      where('estado', '==', estado)
    );

    const snapshot1 = await getDocs(q1);

    if (!snapshot1.empty) {
      const doc = snapshot1.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as SolicitudAmistad;
    }

    // Si no se encuentra, buscar en dirección contraria
    const q2 = query(
      this.solicitudesCollection,
      where('uidSolicitante', '==', uid2),
      where('uidReceptor', '==', uid1),
      where('estado', '==', estado)
    );

    const snapshot2 = await getDocs(q2);

    if (!snapshot2.empty) {
      const doc = snapshot2.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as SolicitudAmistad;
    }

    return null;
  }

  // Obtener todas las solicitudes pendientes recibidas por un usuario
  async obtenerSolicitudesPendientesRecibidas(uidReceptor: string): Promise<SolicitudAmistad[]> {
    const q = query(
      this.solicitudesCollection,
      where('uidReceptor', '==', uidReceptor),
      where('estado', '==', 'pendiente'),
      orderBy('fechaSolicitud', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as SolicitudAmistad));
  }

  // Obtener todas las solicitudes pendientes enviadas por un usuario
  async obtenerSolicitudesPendientesEnviadas(uidSolicitante: string): Promise<SolicitudAmistad[]> {
    const q = query(
      this.solicitudesCollection,
      where('uidSolicitante', '==', uidSolicitante),
      where('estado', '==', 'pendiente'),
      orderBy('fechaSolicitud', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as SolicitudAmistad));
  }

  // Marcar solicitud como notificada
  async marcarComoNotificada(idSolicitud: string): Promise<void> {
    const solicitudRef = doc(this.firestore, `solicitudes_amistad/${idSolicitud}`);
    await updateDoc(solicitudRef, {
      notificado: true
    });
  }

  // Eliminar solicitud (administración)
  async eliminarSolicitud(idSolicitud: string): Promise<void> {
    const solicitudRef = doc(this.firestore, `solicitudes_amistad/${idSolicitud}`);
    await deleteDoc(solicitudRef);
  }
}
