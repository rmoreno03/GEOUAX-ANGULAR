import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  errorMessage = '';
  registerForm: any;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }



  onSubmit() {
    const { email, password } = this.registerForm.value;
    if (email && password) {
      this.auth.register(email, password)
        .then(() => this.router.navigate(['/']))
        .catch(err => this.errorMessage = 'Error al registrar. Puede que el correo ya exista.');
    }
  }
}
