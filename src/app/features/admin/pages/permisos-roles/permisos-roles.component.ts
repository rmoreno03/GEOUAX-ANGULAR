import { Component, OnInit, inject } from '@angular/core';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  DocumentReference,
  DocumentData,
} from '@angular/fire/firestore';

@Component({
  standalone: false,
  selector: 'app-permisos-roles',
  templateUrl: './permisos-roles.component.html',
  styleUrls: ['./permisos-roles.component.css']
})
export class PermisosRolesComponent implements OnInit {
  firestore = inject(Firestore);

  roles = ['admin', 'moderador', 'usuario'];
  permisos = [
    { clave: 'crear_ruta', nombre: 'Crear ruta' },
    { clave: 'ver_estadisticas', nombre: 'Ver estadísticas' },
    { clave: 'editar_perfil', nombre: 'Editar perfil' },
    { clave: 'moderar_contenido', nombre: 'Moderar contenido' },
    { clave: 'gestionar_usuarios', nombre: 'Gestionar usuarios' }
  ];

  permisosPorRol: Record<string, Record<string, boolean>> = {};
  cambiosPendientes: Record<string, boolean> = {};
  cargando = true;
  mostrarExito = false;
  mensajeExito = '';

  ngOnInit(): void {
    this.roles.forEach(async rol => {
      const ref: DocumentReference<DocumentData> = doc(this.firestore, 'roles', rol);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        const permisosVacios: Record<string, boolean> = {};
        this.permisos.forEach(p => permisosVacios[p.clave] = false);
        await setDoc(ref, permisosVacios);
        this.permisosPorRol[rol] = permisosVacios;
      } else {
        this.permisosPorRol[rol] = snap.data() as Record<string, boolean>;
      }

      this.cambiosPendientes[rol] = false;
      this.cargando = false;
    });
  }

  togglePermisoLocal(rol: string, permiso: string): void {
    this.permisosPorRol[rol][permiso] = !this.permisosPorRol[rol][permiso];
    this.cambiosPendientes[rol] = true;
  }

  async guardarCambios(rol: string): Promise<void> {
    const ref = doc(this.firestore, 'roles', rol);
    await setDoc(ref, this.permisosPorRol[rol], { merge: true });
    this.cambiosPendientes[rol] = false;
    this.mensajeExito = `Permisos de ${rol} actualizados.`;
    this.mostrarExito = true;

    setTimeout(() => this.mostrarExito = false, 3000);
  }

  tienePermiso(rol: string, permiso: string): boolean {
    return !!this.permisosPorRol[rol]?.[permiso];
  }
}
