import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private defaultConfig: MatSnackBarConfig = {
    duration: 5000,
    horizontalPosition: 'right', // Posizione standard per le notifiche
    verticalPosition: 'top'
  };

  constructor(private snackBar: MatSnackBar) {}

  showSuccess(message: string, config?: MatSnackBarConfig): void {
    this.snackBar.open(message, 'Chiudi', {
      ...this.defaultConfig,
      ...config,
      panelClass: ['success-snackbar']
    });
  }

  showError(message: string, config?: MatSnackBarConfig): void {
    this.snackBar.open(message, 'Chiudi', {
      ...this.defaultConfig,
      ...config,
      duration: 8000, // Gli errori rimangono visibili più a lungo
      panelClass: ['error-snackbar']
    });
  }

  showWarning(message: string, config?: MatSnackBarConfig): void {
    this.snackBar.open(message, 'Chiudi', {
      ...this.defaultConfig,
      ...config,
      panelClass: ['warning-snackbar']
    });
  }

  showInfo(message: string, config?: MatSnackBarConfig): void {
    this.snackBar.open(message, 'Chiudi', {
      ...this.defaultConfig,
      ...config,
      panelClass: ['info-snackbar']
    });
  }

  /**
   * 🆕 METODO AGGIUNTO: Gestisce automaticamente gli errori HTTP
   * Estrae il messaggio leggibile dall'oggetto errore del backend
   */
  showApiError(error: any): void {
    let message = 'Si è verificato un errore imprevisto';

    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        message = 'Impossibile connettersi al server. Controlla la tua connessione.';
      } else if (error.status === 401) {
        message = 'Sessione scaduta o credenziali non valide.';
      } else if (error.status === 403) {
        message = 'Accesso negato.';
      } else if (error.status === 404) {
        message = 'Risorsa non trovata (404).';
      } else if (error.status === 500) {
        message = 'Errore interno del server.';
      } else if (typeof error.error === 'string') {
        // A volte il backend manda una stringa semplice
        message = error.error;
      } else if (error.error && error.error.message) {
        // Spesso Quarkus/Spring mandano un oggetto JSON { "message": "..." }
        message = error.error.message;
      }
    } else if (typeof error === 'string') {
      message = error;
    }

    this.showError(message);
  }
}
