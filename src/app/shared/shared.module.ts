import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DuracionPipe } from './pipes/duracion.pipe';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';



@NgModule({
  declarations: [
    DuracionPipe
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    FormsModule,
    ToastModule
  ],
  exports: [
    DuracionPipe,
    ToastModule,
  ],
  providers: [
    MessageService
  ],
})
export class SharedModule { }
