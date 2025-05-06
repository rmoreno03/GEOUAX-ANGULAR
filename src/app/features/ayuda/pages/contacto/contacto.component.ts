import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContactoService } from '../../services/contacto.service';

interface MensajeChat {
  contenido: string;
  esUsuario: boolean;
  hora: string;
}

interface PreguntaFrecuente {
  pregunta: string;
  respuesta: string;
  expanded: boolean;
}

@Component({
  standalone: false,
  selector: 'app-contacto',
  templateUrl: './contacto.component.html',
  styleUrls: ['./contacto.component.css']
})
export class ContactoComponent implements OnInit {

  contactForm!: FormGroup;

  // Variables de estado del formulario
  enviando: boolean = false;
  mensajeEnviado: boolean = false;

  // Variables para chat
  chatAbierto: boolean = false;
  mensajeChat: string = '';
  mensajesChat: MensajeChat[] = [];

  // Referencia al elemento de mensajes para scroll automático
  @ViewChild('chatMessages') private messagesElement!: ElementRef;

  // Preguntas frecuentes de soporte
  preguntasSoporte: PreguntaFrecuente[] = [
    {
      pregunta: '¿Cuál es el tiempo de respuesta habitual?',
      respuesta: 'Normalmente respondemos en un plazo de 24-48 horas laborables. Para consultas urgentes, te recomendamos utilizar el chat en vivo durante el horario de atención.',
      expanded: false
    },
    {
      pregunta: '¿Cómo puedo reportar un problema con mi cuenta?',
      respuesta: 'Puedes utilizar este formulario de contacto seleccionando la categoría "Problemas con la cuenta" y explicando con detalle tu situación. Es importante que incluyas tu nombre de usuario y cualquier mensaje de error que hayas recibido.',
      expanded: false
    },
    {
      pregunta: '¿Ofrecen soporte técnico durante los fines de semana?',
      respuesta: 'Nuestro equipo de soporte está disponible los sábados de 10:00 a 14:00. Los domingos y festivos no ofrecemos soporte técnico, pero puedes dejar tu consulta y te responderemos el siguiente día laborable.',
      expanded: false
    },
    {
      pregunta: '¿Cómo puedo solicitar la recuperación de una ruta eliminada?',
      respuesta: 'Para solicitar la recuperación de una ruta eliminada, contacta con nosotros a través del formulario seleccionando la categoría "Problemas con rutas". Es importante que incluyas la fecha aproximada de eliminación y toda la información que recuerdes sobre la ruta (nombre, ubicación, etc.).',
      expanded: false
    },
    {
      pregunta: '¿Dónde puedo enviar sugerencias para mejorar la aplicación?',
      respuesta: 'Valoramos mucho tus sugerencias. Puedes enviarlas a través de este formulario seleccionando la categoría "Sugerencia". Nuestro equipo las revisa periódicamente para implementar mejoras en futuras actualizaciones.',
      expanded: false
    }
  ];

  constructor(
    private fb: FormBuilder,
    private contactoService: ContactoService
  ) {
    this.crearFormulario();
  }

  ngOnInit(): void {
    // Inicialización adicional si fuera necesaria
  }

  /**
   * Crea el formulario de contacto con sus validaciones
   */
  crearFormulario(): void {
    this.contactForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      asunto: ['', [Validators.required, Validators.minLength(5)]],
      categoria: ['', Validators.required],
      mensaje: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(500)]],
      privacidad: [false, Validators.requiredTrue],
      newsletter: [false]
    });
  }

  /**
   * Getter para validación de campo nombre
   */
  get nombreInvalido(): boolean {
    return this.formularioEnviado && (this.nombreControl?.invalid ?? false);
  }

  /**
   * Getter para validación de campo email
   */
  get emailInvalido(): boolean {
    return this.formularioEnviado && !!this.emailControl?.invalid;
  }

  /**
   * Getter para validación de campo asunto
   */
  get asuntoInvalido(): boolean {
    return this.formularioEnviado && (this.asuntoControl?.invalid ?? false);
  }

  /**
   * Getter para validación de campo categoría
   */
  get categoriaInvalida(): boolean {
    return this.formularioEnviado && (this.categoriaControl?.invalid ?? false);
  }

  /**
   * Getter para validación de campo mensaje
   */
  get mensajeInvalido(): boolean {
    return this.formularioEnviado && (this.mensajeControl?.invalid ?? false);
  }

  /**
   * Getter para validación de campo privacidad
   */
  get privacidadInvalida(): boolean {
    return this.formularioEnviado && !!this.privacidadControl?.invalid;
  }

  /**
   * Getter para control de nombre
   */
  get nombreControl() {
    return this.contactForm.get('nombre');
  }

  /**
   * Getter para control de email
   */
  get emailControl() {
    return this.contactForm.get('email');
  }

  /**
   * Getter para control de asunto
   */
  get asuntoControl() {
    return this.contactForm.get('asunto');
  }

  /**
   * Getter para control de categoría
   */
  get categoriaControl() {
    return this.contactForm.get('categoria');
  }

  /**
   * Getter para control de mensaje
   */
  get mensajeControl() {
    return this.contactForm.get('mensaje');
  }

  /**
   * Getter para control de privacidad
   */
  get privacidadControl() {
    return this.contactForm.get('privacidad');
  }

  // Variable para controlar si se ha enviado el formulario (para validaciones)
  private formularioEnviado: boolean = false;

  /**
   * Envía el mensaje de contacto
   */
  enviarMensaje(): void {
    this.formularioEnviado = true;

    if (this.contactForm.invalid) {
      return;
    }

    this.enviando = true;

    this.contactoService.enviarMensaje(this.contactForm.value).subscribe(
      () => {
        this.enviando = false;
        this.mensajeEnviado = true;
      },
      (error) => {
        console.error('Error al enviar mensaje:', error);
        this.enviando = false;
        // Aquí se podría mostrar un mensaje de error
      }
    );
  }

  /**
   * Reinicia el formulario a su estado inicial
   */
  resetForm(): void {
    this.contactForm.reset();
    this.formularioEnviado = false;
    this.mensajeEnviado = false;

    // Vuelve a establecer los valores por defecto para checkboxes
    this.contactForm.get('privacidad')?.setValue(false);
    this.contactForm.get('newsletter')?.setValue(false);
  }

  /**
   * Expande o colapsa una pregunta frecuente
   * @param index Índice de la pregunta en el array
   */
  togglePregunta(index: number): void {
    this.preguntasSoporte[index].expanded = !this.preguntasSoporte[index].expanded;
  }

  /**
   * Abre el chat en vivo
   */
  iniciarChat(): void {
    this.chatAbierto = true;
    this.mensajesChat = [];

    // Simulamos un mensaje inicial de agente después de 1 segundo
    setTimeout(() => {
      this.agregarMensajeAgente('Hola, soy Sandra del equipo de soporte. ¿En qué puedo ayudarte hoy?');
    }, 1000);
  }

  /**
   * Cierra el chat en vivo
   */
  cerrarChat(): void {
    this.chatAbierto = false;
    this.mensajesChat = [];
    this.mensajeChat = '';
  }

  /**
   * Envía un mensaje del usuario en el chat
   */
  enviarMensajeChat(): void {
    if (!this.mensajeChat.trim()) {
      return;
    }

    // Agregar mensaje del usuario
    this.agregarMensajeUsuario(this.mensajeChat);

    const mensajeEnviado = this.mensajeChat;
    this.mensajeChat = '';

    // Simular respuesta de agente (en una aplicación real, esto sería una llamada al servicio)
    setTimeout(() => {
      let respuesta: string;

      // Simulamos algunas respuestas básicas basadas en palabras clave
      if (mensajeEnviado.toLowerCase().includes('horario')) {
        respuesta = 'Nuestro horario de atención es de lunes a viernes de 9:00 a 18:00, y sábados de 10:00 a 14:00.';
      } else if (mensajeEnviado.toLowerCase().includes('ruta') || mensajeEnviado.toLowerCase().includes('mapa')) {
        respuesta = 'Para problemas con rutas, necesitaría más detalles. ¿Podrías describir exactamente qué problema tienes al crear o visualizar la ruta?';
      } else if (mensajeEnviado.toLowerCase().includes('cuenta') || mensajeEnviado.toLowerCase().includes('contraseña')) {
        respuesta = 'Para problemas con tu cuenta, puedo ayudarte. ¿Has intentado restablecer tu contraseña desde la opción "Olvidé mi contraseña" en la pantalla de inicio de sesión?';
      } else {
        respuesta = 'Gracias por tu consulta. Para poder ayudarte mejor, ¿podrías proporcionarme más detalles sobre tu problema?';
      }

      this.agregarMensajeAgente(respuesta);
    }, 1500);
  }

  /**
   * Agrega un mensaje del usuario al chat
   * @param contenido Contenido del mensaje
   */
  agregarMensajeUsuario(contenido: string): void {
    this.mensajesChat.push({
      contenido,
      esUsuario: true,
      hora: this.obtenerHoraActual()
    });

    this.scrollChatToBottom();
  }

  /**
   * Agrega un mensaje del agente al chat
   * @param contenido Contenido del mensaje
   */
  agregarMensajeAgente(contenido: string): void {
    this.mensajesChat.push({
      contenido,
      esUsuario: false,
      hora: this.obtenerHoraActual()
    });

    this.scrollChatToBottom();
  }

  /**
   * Obtiene la hora actual formateada
   * @returns Hora actual en formato HH:MM
   */
  obtenerHoraActual(): string {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  /**
   * Hace scroll al final del chat para mostrar los mensajes más recientes
   */
  scrollChatToBottom(): void {
    setTimeout(() => {
      if (this.messagesElement) {
        const element = this.messagesElement.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    }, 100);
  }
}
