import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DuracionPipe } from './pipes/duracion.pipe';
import { PopupExitoComponent } from './components/popup-exito/popup-exito.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';



@NgModule({
  declarations: [
    DuracionPipe,
    PopupExitoComponent,
    ConfirmDialogComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    FormsModule,

  ],
  exports: [
    DuracionPipe,
    PopupExitoComponent,
    ConfirmDialogComponent,
  ],
  providers: [

  ],
})
export class SharedModule { }
