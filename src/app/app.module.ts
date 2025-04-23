import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { environment } from '../environments/environment';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SharedModule } from './shared/shared.module';
import { FeaturesLayoutComponent } from './features/layout/pages/features-layout/features-layout.component';
import { AuthLayoutComponent } from './features/layout/pages/auth-layout/auth-layout.component';
import { LayoutModule } from './features/layout/layout.module';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';

// Inicializar Firebase
const app = initializeApp(environment.firebase);
export const db = getFirestore(app);
export const auth = getAuth(app);

@NgModule({
  declarations: [
    AppComponent,
    AuthLayoutComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    CommonModule,
    LayoutModule
  ],
  providers: [
    provideAnimationsAsync(),
        providePrimeNG({
            theme: {
                preset: Aura
            }
        })
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
