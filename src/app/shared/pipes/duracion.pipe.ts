import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'duracion',
  standalone: false
})
export class DuracionPipe implements PipeTransform {
  transform(minutos: number): string {
    if (minutos < 60) {
      return `${Math.round(minutos)} min`;
    }

    const horas = Math.floor(minutos / 60);
    const mins = Math.round(minutos % 60);
    return `${horas} h ${mins} min`;
  }
}
