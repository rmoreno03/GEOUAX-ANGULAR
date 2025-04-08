import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { FooterComponent } from './components/footer/footer.component';
import { TopBarComponent } from './components/top-bar/top-bar.component';
import { FeaturesLayoutComponent } from './pages/features-layout/features-layout.component';



@NgModule({
  declarations: [
    SidebarComponent,
    FooterComponent,
    TopBarComponent,
    FeaturesLayoutComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    FormsModule
  ],
  exports: [
    SidebarComponent,
    FooterComponent,
    TopBarComponent,
    FeaturesLayoutComponent
  ]
})
export class LayoutModule { }
