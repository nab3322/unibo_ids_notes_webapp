import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { NotificationService } from '../services/notification.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private readonly MAX_RETRIES = 2;
  private readonly RETRY_DELAY = 1000;

  constructor(
    private notificationService: NotificationService,
    private snackBar: MatSnackBar
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      retry({
        count: this.shouldRetry(req) ? this.MAX_RETRIES : 0,
        delay: this.RETRY_DELAY
      }),
      catchError((error: HttpErrorResponse) => {
        this.handleError(error, req);
        return throwError(() => error);
      })
    );
  }

  private handleError(error: HttpErrorResponse, req: HttpRequest<any>): void {
    if (this.shouldSkipErrorHandling(req, error)) {
      return;
    }

    let errorMessage = 'Si è verificato un errore imprevisto';
    let showNotification = true;

    // Gestione Codici Errore
    switch (error.status) {
      case 0: errorMessage = 'Errore di connessione. Verifica internet.'; break;
      case 400: errorMessage = this.extractErrorMessage(error) || 'Richiesta non valida'; break;
      case 401: showNotification = false; break; // Gestito da AuthInterceptor
      case 403: errorMessage = 'Non hai i permessi necessari.'; break;
      case 404: errorMessage = 'Risorsa non trovata'; break;
      case 409: errorMessage = this.extractErrorMessage(error) || 'Conflitto dati'; break;
      case 422: errorMessage = this.extractErrorMessage(error) || 'Dati non validi'; break;
      case 429: errorMessage = 'Troppe richieste. Riprova più tardi.'; break;
      case 500: errorMessage = 'Errore del server.'; break;
      case 503: errorMessage = 'Servizio non disponibile'; break;
      case 504: errorMessage = 'Timeout del server'; break;
      default: errorMessage = `Errore ${error.status}`; break;
    }

    if (showNotification) {
      const isServerError = error.status >= 500 || error.status === 0;

      if (isServerError) {
        // Ora questo funziona perché snackBar è iniettato correttamente
        const snackBarRef = this.snackBar.open(errorMessage, 'Ricarica', {
          duration: 0, // Persistente
          panelClass: ['error-snackbar']
        });

        snackBarRef.onAction().subscribe(() => {
          window.location.reload();
        });
      } else {
        this.notificationService.showError(errorMessage);
      }
    }

    this.logError(error, req);
  }

  // ... (Tieni pure i metodi privati extractErrorMessage, shouldRetry, logError come erano prima)
  private extractErrorMessage(error: HttpErrorResponse): string | null {
      if (error.error) {
          if (typeof error.error === 'string') return error.error;
          if (error.error.message) return error.error.message;
          if (error.error.error) return error.error.error;
      }
      return error.message || null;
  }

  private shouldRetry(req: HttpRequest<any>): boolean {
    if (req.url.includes('/api/auth/')) return false;
    if (req.body instanceof FormData) return false;
    return ['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  }

  private shouldSkipErrorHandling(req: HttpRequest<any>, error: HttpErrorResponse): boolean {
    return req.headers.has('Skip-Error-Handling') || error.status === 401;
  }

  private logError(error: HttpErrorResponse, req: HttpRequest<any>): void {
    console.error('HTTP Error:', error.status, req.url);
  }
}
