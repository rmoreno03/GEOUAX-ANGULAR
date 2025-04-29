import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  standalone: false,
  selector: 'app-crear-reto-personalizado',
  templateUrl: './crear-reto-personalizado.component.html',
  styleUrls: ['./crear-reto-personalizado.component.css']
})
export class CrearRetoPersonalizadoComponent implements OnInit {
getDuracionNombre() {
throw new Error('Method not implemented.');
}
getTipoRetoDescripcion() {
throw new Error('Method not implemented.');
}
  // Estados de la interfaz
  loading = false;
  submitting = false;
  error = '';
  success = false;

  // Formulario de creación de reto
  retoForm: FormGroup;

  // Tipos de retos disponibles
  tiposRetos = [
    { id: 'distancia', nombre: 'Distancia', descripcion: 'Recorrer una distancia específica en un período de tiempo', icono: 'road' },
    { id: 'puntos', nombre: 'Puntos de interés', descripcion: 'Visitar un número determinado de puntos de interés', icono: 'map-marker-alt' },
    { id: 'rutas', nombre: 'Completar rutas', descripcion: 'Completar un número específico de rutas', icono: 'route' },
    { id: 'elevacion', nombre: 'Elevación', descripcion: 'Acumular un desnivel específico', icono: 'mountain' },
    { id: 'tiempo', nombre: 'Tiempo activo', descripcion: 'Acumular un tiempo específico realizando rutas', icono: 'clock' }
  ];

  // Opciones de duración
  duraciones = [
    { id: 7, nombre: '1 semana', dias: 7 },
    { id: 14, nombre: '2 semanas', dias: 14 },
    { id: 30, nombre: '1 mes', dias: 30 },
    { id: 90, nombre: '3 meses', dias: 90 },
    { id: 180, nombre: '6 meses', dias: 180 },
    { id: 365, nombre: '1 año', dias: 365 }
  ];

  // Icono seleccionado para el reto
  iconoSeleccionado = 'mountain';

  // Opciones de iconos disponibles
  iconosDisponibles = [
    'mountain', 'route', 'road', 'map-marker-alt', 'hiking',
    'running', 'biking', 'flag-checkered', 'clock', 'trophy',
    'sun', 'moon', 'tree', 'leaf', 'compass'
  ];

  // Amigos disponibles para invitar (simulados)
  amigosDisponibles = [
    { id: 1, nombre: 'Ana García', imagen: null, seleccionado: false },
    { id: 2, nombre: 'Carlos Pérez', imagen: null, seleccionado: false },
    { id: 3, nombre: 'Laura Martínez', imagen: null, seleccionado: false },
    { id: 4, nombre: 'David Rodríguez', imagen: null, seleccionado: false },
    { id: 5, nombre: 'Elena Sánchez', imagen: null, seleccionado: false }
  ];

  constructor(private fb: FormBuilder) {
    this.retoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(50)]],
      descripcion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]],
      tipoReto: ['distancia', Validators.required],
      objetivo: ['', [Validators.required, Validators.min(1)]],
      unidad: ['km'],
      duracion: [30, Validators.required],
      fechaInicio: [this.obtenerFechaActual(), Validators.required],
      publico: [true],
      icono: ['mountain'],
      amigosInvitados: [[]]
    });
  }

  ngOnInit(): void {
    // Al iniciar, actualizamos la unidad según el tipo de reto seleccionado
    this.actualizarUnidad(this.retoForm.get('tipoReto')?.value);

    // Nos suscribimos a cambios en el tipo de reto para actualizar la unidad correspondiente
    this.retoForm.get('tipoReto')?.valueChanges.subscribe(tipo => {
      this.actualizarUnidad(tipo);
    });
  }

  // Método para actualizar la unidad de medida según el tipo de reto
  actualizarUnidad(tipo: string): void {
    const control = this.retoForm.get('unidad');

    switch(tipo) {
      case 'distancia':
        control?.setValue('km');
        break;
      case 'puntos':
        control?.setValue('puntos');
        break;
      case 'rutas':
        control?.setValue('rutas');
        break;
      case 'elevacion':
        control?.setValue('m');
        break;
      case 'tiempo':
        control?.setValue('horas');
        break;
      default:
        control?.setValue('km');
    }
  }

  // Método para obtener la fecha actual en formato yyyy-MM-dd
  obtenerFechaActual(): string {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const dia = fecha.getDate().toString().padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  }

  // Método para seleccionar un icono
  seleccionarIcono(icono: string): void {
    this.iconoSeleccionado = icono;
    this.retoForm.get('icono')?.setValue(icono);
  }

  // Método para alternar la selección de un amigo
  toggleAmigo(amigo: any): void {
    amigo.seleccionado = !amigo.seleccionado;

    // Actualizamos la lista de amigos seleccionados en el formulario
    const amigosSeleccionados = this.amigosDisponibles
      .filter(a => a.seleccionado)
      .map(a => a.id);

    this.retoForm.get('amigosInvitados')?.setValue(amigosSeleccionados);
  }

  // Método para enviar el formulario
  onSubmit(): void {
    if (this.retoForm.invalid) {
      // Marcamos todos los campos como tocados para mostrar los errores
      Object.keys(this.retoForm.controls).forEach(key => {
        const control = this.retoForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.submitting = true;

    // Simulación de envío
    setTimeout(() => {
      console.log('Formulario enviado:', this.retoForm.value);
      this.submitting = false;
      this.success = true;

      // Reseteamos el formulario después de mostrar el mensaje de éxito
      setTimeout(() => {
        this.retoForm.reset({
          tipoReto: 'distancia',
          duracion: 30,
          fechaInicio: this.obtenerFechaActual(),
          publico: true,
          icono: 'mountain',
          amigosInvitados: []
        });
        this.iconoSeleccionado = 'mountain';
        this.amigosDisponibles.forEach(amigo => amigo.seleccionado = false);
        this.success = false;
      }, 3000);
    }, 1500);
  }

  // Método para comprobar si un campo es inválido y ha sido tocado
  isFieldInvalid(fieldName: string): boolean {
    const field = this.retoForm.get(fieldName);
    return !!field && field.invalid && (field.dirty || field.touched);
  }
}
