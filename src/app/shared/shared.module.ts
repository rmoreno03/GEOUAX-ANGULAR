import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DuracionPipe } from './pipes/duracion.pipe';



@NgModule({
  declarations: [
    DuracionPipe
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    FormsModule
  ],
  exports: [
    DuracionPipe
  ]
})
export class SharedModule { }
