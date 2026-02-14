import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar'; // Per le notifiche
import { AuthService } from '../../core/services/auth.service';
import { RegisterRequest } from '../../core/models/user.model';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html', // <--- Collega l'HTML
  styleUrls: ['./register.component.scss']  // <--- Collega il SCSS
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]] // Opzionale: per conferma password
    }, { validators: this.passwordMatchValidator });
  }

  // Validatore custom per controllare che le password coincidano
  private passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loading = true;

      const request: RegisterRequest = {
        username: this.registerForm.value.username,
        email: this.registerForm.value.email,
        password: this.registerForm.value.password
      };

      this.authService.register(request).subscribe({
        next: (response) => {
          this.loading = false;
          this.showNotification('Registrazione avvenuta con successo! Ora puoi accedere.', 'success');
          this.router.navigate(['/auth/login']);
        },
        error: (err) => {
          this.loading = false;
          console.error('Errore registrazione:', err);
          // Messaggio di errore user-friendly
          const errorMsg = err.error?.message || 'Errore durante la registrazione. Riprova.';
          this.showNotification(errorMsg, 'error');
        }
      });
    }
  }

  private showNotification(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Chiudi', {
      duration: 5000,
      panelClass: type === 'error' ? ['error-snackbar'] : ['success-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }
}
