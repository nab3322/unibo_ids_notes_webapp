import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LoginRequest } from '../../core/models/user.model';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-login',
  templateUrl: 'login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  hidePassword = true;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.loginForm = this.fb.group({
      identifier: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      const { identifier, password, rememberMe } = this.loginForm.value;

      const loginRequest: LoginRequest = {
        username: identifier,
        password: password,
        rememberMe: rememberMe
      };

      this.authService.login(loginRequest).subscribe({
        next: () => {
          this.notificationService.showSuccess('Login effettuato con successo!');
          this.router.navigate(['/notes']);
        },
        error: (err) => {
          this.loading = false;
          console.error('Login error:', err);
          this.errorMessage = 'Username o password errati.';
          this.notificationService.showError(this.errorMessage);
        }
      });
    }
  }
}
