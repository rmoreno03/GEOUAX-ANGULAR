# 🌍 GeoUAX — Plataforma de Geolocalización Sostenible con Angular

**GeoUAX** es una aplicación desarrollada con **Angular 19+**, centrada en la creación, gestión y seguimiento de rutas personalizadas, con una fuerte orientación a la sostenibilidad, el análisis de la huella de carbono y el uso responsable de tecnologías de geolocalización. Este proyecto ha sido realizado como parte de un Trabajo de Fin de Grado (TFG).

---

## 🚀 Funcionalidades destacadas

- 🗺️ Visualización de rutas interactivas en mapas con Mapbox.
- 📍 Gestión de puntos de interés con metadatos enriquecidos.
- 👣 Cálculo de huella de carbono por ruta y medio de transporte.
- 🔐 Sistema de autenticación completo (correo, Google, verificación).
- 🖼️ Subida de imágenes con validación por inteligencia artificial.
- 📊 Estadísticas de uso, logros, perfiles públicos y sistema de amistad.
- 🧑‍💼 Panel de administración con gestión de roles y logs de actividad.

---

## 🛠️ Tecnologías empleadas

- **Angular CLI** `v19.2.0` + **TypeScript**
- **Firebase**: Firestore, Auth, Storage
- **Mapbox GL JS**: mapas, rutas y navegación
- **Karma + Jasmine**: testing unitario
- **HTML5 + CSS3**: diseño responsive (fuente *Poppins*)
- **IA externa**: validación de imágenes para subida responsable

---

## 📦 Instalación del proyecto

Clona el repositorio:

```bash
git clone https://github.com/rmoreno03/GEOUAX-ANGULAR.git
cd GEOUAX-ANGULAR
npm install
```

---

## 🔧 Servidor de desarrollo

Inicia el entorno local:

```bash
ng serve
```

Abre en tu navegador: [`http://localhost:4200/`](http://localhost:4200/)

---

## ⚙️ Comandos útiles

| Acción                        | Comando                                      |
|-----------------------------|----------------------------------------------|
| Iniciar servidor local       | `ng serve`                                   |
| Compilar para producción     | `ng build --configuration production`        |
| Generar componente           | `ng generate component nombre-componente`    |
| Ejecutar tests unitarios     | `ng test`                                    |
| Ejecutar pruebas E2E         | `ng e2e` *(requiere configuración previa)*   |

---

## 🧪 Testing y validación

Angular integra pruebas unitarias mediante Karma y Jasmine:

```bash
ng test
```

> La validación de imágenes subidas se realiza con una API externa de inteligencia artificial desplegada con Firebase Functions.

---

## 🌐 Despliegue

Compilación optimizada para producción:

```bash
ng build --configuration production
```

Los archivos se generarán en la carpeta `dist/` listos para ser desplegados.

---

## 🔒 Seguridad y autenticación

- Registro mediante email y cuenta de Google.
- Verificación por correo electrónico obligatoria.
- Recuperación de contraseña.
- Gestión de rutas protegidas según el rol del usuario.
- Protección de funcionalidades críticas para usuarios no administradores.

---

## 📃 Scripts personalizados (`package.json`)

A continuación se describen los scripts incluidos en el `package.json`, que automatizan tareas comunes de desarrollo y despliegue:

| Script             | Descripción                                                                         |
|--------------------|-------------------------------------------------------------------------------------|
| `start`            | Abre la app en Microsoft Edge y lanza el servidor de desarrollo con `ng serve`.     |
| `start-lint`       | Ejecuta `lint` y luego arranca el servidor. Ideal para desarrollo limpio.           |
| `build`            | Compila el proyecto con configuración por defecto.                                  |
| `build-dev`        | Compila el proyecto con configuración de desarrollo. Output: `dist/geouax/browser`. |
| `build-prod`       | Compila para producción. Output: `dist/geouax/browser`.                             |
| `watch`            | Compila en modo observador (watch) para desarrollo continuo.                        |
| `test`             | Ejecuta los tests unitarios en modo headless (sin navegador).                       |
| `lint`             | Linter con corrección automática de estilo de código.                               |
| `firebase-deploy`  | Despliega solo el hosting en Firebase.                                              |
| `deploy`           | Compila con `build` y despliega automáticamente a Firebase.                         |
| `deploy-dev`       | Compila en modo desarrollo y despliega a Firebase.                                  |

> Estos scripts permiten optimizar el flujo de trabajo tanto en desarrollo local como en entornos de despliegue.

---

## 📚 Documentación del proyecto

Puedes encontrar la documentación técnica, memoria y material adicional en el siguiente enlace del repositorio:

📄 [Documentación GeoUAX](https://github.com/rmoreno03/GEOUAX-ANGULAR/tree/main)

Aqui puedes encontrar la documentación detallada

📄 [Documentación GeoUAX](https://deepwiki.com/rmoreno03/GEOUAX-ANGULAR/tree/main)

---

## 🤝 Contribuciones

Este proyecto ha sido desarrollado de forma individual con fines académicos.  
Las contribuciones externas no están habilitadas, pero se agradecen sugerencias mediante Issues.

---

## 👨‍💻 Autor y contacto

**Raúl Moreno Moya**  
Proyecto desarrollado como Trabajo de Fin de Grado  
GitHub: [@rmoreno03](https://github.com/rmoreno03)

---

