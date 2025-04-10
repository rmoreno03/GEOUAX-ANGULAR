import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-info-panel',
  templateUrl: './info-panel.component.html',
  standalone: false,
  styleUrls: ['./info-panel.component.css']
})
export class InfoPanelComponent {
  @Input() isOpen = false;
  @Output() closePanel = new EventEmitter<void>();

  infoItems = [
    {
      title: 'Acerca de',
      content: `
        <p>GeoUAX es una aplicación desarrollada como parte del Proyecto de Fin de Grado de Raúl Moreno Moya, en colaboración con la Universidad Alfonso X el Sabio (UAX) y la empresa CIMPA.</p>
        <p>Su objetivo principal es fomentar prácticas sostenibles mediante la geolocalización de rutas ecológicas y puntos de interés ambiental.</p>
        <p>A través de funcionalidades como la creación de rutas personalizadas, seguimiento mediante fotografías, visualización de puntos clave y evaluación de impacto, GeoUAX pretende reducir la huella de carbono individual y promover un cambio positivo en la sociedad.</p>
      `,
      open: false
    },
    {
      title: 'Política de privacidad',
      content: `
        <p>En GeoUAX nos tomamos muy en serio tu privacidad. La información que recopilamos, incluyendo datos de localización, imágenes y credenciales de usuario, es utilizada exclusivamente para mejorar la experiencia dentro de la aplicación.</p>
        <p>Tus datos no serán compartidos con terceros sin tu consentimiento. Utilizamos Firebase Authentication, Firestore y Firebase Storage bajo estándares de seguridad modernos para proteger tus datos personales.</p>
        <p>Puedes solicitar la eliminación de tus datos en cualquier momento contactando al soporte técnico o desde la configuración de tu cuenta.</p>
      `,
      open: false
    },
    {
      title: 'Términos y condiciones',
      content: `
        <p>El uso de GeoUAX implica la aceptación de estos términos:</p>
        <ul>
          <li>El usuario es responsable del contenido que sube, incluyendo imágenes y descripciones de rutas.</li> <br/>
          <li>Está prohibido el uso indebido de la plataforma con fines comerciales, ofensivos o ilegales.</li> <br/>
          <li>GeoUAX se reserva el derecho de suspender cuentas que infrinjan las políticas establecidas.</li> <br/>
          <li>La aplicación puede estar en fase de desarrollo o pruebas; por tanto, algunas funcionalidades pueden verse limitadas o experimentar cambios.</li> <br/>
          <li>Al utilizar GeoUAX, aceptas que la aplicación recopile datos necesarios para su funcionamiento y mejoras continuas, siempre bajo los principios de transparencia y seguridad.</li>
        </ul>
      `,
      open: false
    },
    {
      title: 'Repositorio del proyecto',
      content: `
        <p>Puedes acceder al código fuente completo del proyecto en GitHub:</p>
        <p><a href="https://github.com/rmoreno03/GEOUAX-ANGULAR" target="_blank" rel="noopener noreferrer">Ver repositorio en GitHub</a></p>
      `,
      open: false
    },
    {
      title: 'Descargar memoria del proyecto',
      content: `
        <p>Puedes descargar la memoria del proyecto en formato PDF desde el siguiente enlace:</p>
        <p><a href="assets/memoria-geoUAX.pdf" download>Descargar memoria (PDF)</a></p>
      `,
      open: false
    },
    {
      title: 'Contacto y créditos',
      content: `
        <p>Proyecto realizado por Raúl Moreno Moya.</p>
        <p>Alumno del Grado en Desarrollo de Aplicaciones Multiplataforma (UAX).</p>
        <p>En colaboración con CIMPA.</p>
        <p>Contacto: <a href="mailto:rmoremoy@myuax.com">rmoremoy@myuax.com</a></p>
      `,
      open: false
    }

  ];



  close() {
    this.closePanel.emit();
  }

  toggle(item: any) {
    item.open = !item.open;
  }
}
