import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FiltroPuntoLocalizacion } from '../../models/filtrar-punto-localizacion.model';

@Injectable({providedIn: 'root'})
export class FilterService {

  private filterSubject = new BehaviorSubject<FiltroPuntoLocalizacion>({});
  filter$ = this.filterSubject.asObservable();

  setFilter(value: FiltroPuntoLocalizacion) {
    this.filterSubject.next(value);
  }


}
