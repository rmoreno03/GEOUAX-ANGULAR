import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  errorMessage = '';
  showPassword = false;

  loginForm: any;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }


  get email() {
    return this.loginForm.get('email')!;
  }

  get password() {
    return this.loginForm.get('password')!;
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    const { email, password } = this.loginForm.value;
    if (!this.loginForm.valid) return;

    this.auth.login(email!, password!)
      .then(() => this.router.navigate(['/puntos']))
      .catch(err => {
        this.errorMessage = 'Error al iniciar sesión: ' + err.message;
      });
  }
}
