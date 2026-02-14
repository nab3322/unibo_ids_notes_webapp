import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, OnDestroy {
  profileForm: FormGroup;
  passwordForm: FormGroup;

  isLoading = false;
  private destroy$ = new Subject<void>();
  private currentUser: User | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    // Form Profilo (solo lettura)
    this.profileForm = this.fb.group({
      name: [''],
      email: [''],
      username: ['']
    });

    // Form Password
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          this.currentUser = user;
          this.profileForm.patchValue({
            name: user.name || user.username,
            email: user.email,
            username: user.username
          });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  changePassword(): void {
    if (this.passwordForm.valid) {
      this.isLoading = true;
      const { currentPassword, newPassword } = this.passwordForm.value;

      this.authService.changePassword(currentPassword, newPassword).subscribe({
        next: () => {
          this.showNotification('Password modificata! Effettua nuovamente il login.', 'success');
          this.passwordForm.reset();
          this.isLoading = false;
        },
        error: (err) => {
          this.showNotification('Errore: Password attuale non corretta', 'error');
          this.isLoading = false;
        }
      });
    }
  }

  exportData(): void {
    const data = {
      profile: this.profileForm.value,
      exportedAt: new Date()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `settings_export_${Date.now()}.json`;
    link.click();
  }

  deleteAccount(): void {
    if (confirm('SEI SICURO? Questa azione è irreversibile e cancellerà tutte le tue note.')) {
      alert('Funzionalità di eliminazione account da implementare nel backend.');
    }
  }

  private showNotification(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Chiudi', {
      duration: 3000,
      panelClass: type === 'error' ? ['error-snackbar'] : ['success-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }
}
