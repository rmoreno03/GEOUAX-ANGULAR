import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { FooterComponent } from './components/footer/footer.component';
import { TopBarComponent } from './components/top-bar/top-bar.component';



@NgModule({
  declarations: [
    SidebarComponent,
    FooterComponent,
    TopBarComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    SidebarComponent,
    FooterComponent,
    TopBarComponent
  ]
})
export class SharedModule { }
