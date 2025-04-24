import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-popup-exito',
  standalone: false,
  templateUrl: './popup-exito.component.html',
  styleUrl: './popup-exito.component.css',
})
export class PopupExitoComponent {

  @Input() mostrar = false;
  @Input() mensaje = 'Acción completada correctamente.';
  @Input() tipo: 'exito' | 'eliminado' | 'warning' = 'exito';

}
