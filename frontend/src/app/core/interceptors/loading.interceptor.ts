import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize, delay } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private activeRequests = new Set<string>();
  private readonly MIN_LOADING_TIME = 300; // Minimum loading time in ms

  constructor(private loadingService: LoadingService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip loading for certain requests
    if (this.shouldSkipLoading(req)) {
      return next.handle(req);
    }

    const requestId = this.generateRequestId(req);
    const loadingKey = this.getLoadingKey(req);
    
    // Start loading
    this.startLoading(requestId, loadingKey, req);

    const startTime = Date.now();

    return next.handle(req).pipe(
      delay(this.calculateMinDelay(startTime)),
      finalize(() => {
        this.stopLoading(requestId, loadingKey);
      })
    );
  }

  /**
   * Start loading for request
   */
  private startLoading(requestId: string, loadingKey: string, req: HttpRequest<any>): void {
    this.activeRequests.add(requestId);
    
    const message = this.getLoadingMessage(req);
    this.loadingService.start(loadingKey, message);
  }

  /**
   * Stop loading for request
   */
  private stopLoading(requestId: string, loadingKey: string): void {
    this.activeRequests.delete(requestId);
    
    // Check if there are other active requests for the same loading key
    const hasActiveRequests = Array.from(this.activeRequests).some(id => 
      id.startsWith(loadingKey)
    );

    if (!hasActiveRequests) {
      this.loadingService.stop(loadingKey);
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(req: HttpRequest<any>): string {
    const loadingKey = this.getLoadingKey(req);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `${loadingKey}_${timestamp}_${random}`;
  }

  /**
   * Get loading key for request grouping
   */
  private getLoadingKey(req: HttpRequest<any>): string {
    // Check for custom loading key in headers
    const customKey = req.headers.get('Loading-Key');
    if (customKey) {
      return customKey;
    }

    // Default loading keys based on URL patterns
    if (req.url.includes('/api/auth/')) {
      return 'auth';
    }
    
    if (req.url.includes('/api/notes/')) {
      if (req.method === 'GET') {
        return 'notes-loading';
      } else {
        return 'notes-saving';
      }
    }
    
    if (req.url.includes('/api/search/')) {
      return 'search';
    }
    
    if (req.url.includes('/upload')) {
      return 'upload';
    }

    // Generic loading key based on HTTP method
    switch (req.method) {
      case 'GET':
        return 'loading';
      case 'POST':
        return 'creating';
      case 'PUT':
      case 'PATCH':
        return 'updating';
      case 'DELETE':
        return 'deleting';
      default:
        return 'processing';
    }
  }

  /**
   * Get loading message for request
   */
  private getLoadingMessage(req: HttpRequest<any>): string {
    // Check for custom loading message in headers
    const customMessage = req.headers.get('Loading-Message');
    if (customMessage) {
      return customMessage;
    }

    // Default messages based on URL patterns
    if (req.url.includes('/api/auth/login')) {
      return 'Accesso in corso...';
    }
    
    if (req.url.includes('/api/auth/register')) {
      return 'Registrazione in corso...';
    }
    
    if (req.url.includes('/api/notes/')) {
      if (req.method === 'GET') {
        return 'Caricamento note...';
      } else if (req.method === 'POST') {
        return 'Creazione nota...';
      } else if (req.method === 'PUT' || req.method === 'PATCH') {
        return 'Salvataggio nota...';
      } else if (req.method === 'DELETE') {
        return 'Eliminazione nota...';
      }
    }
    
    if (req.url.includes('/api/search/')) {
      return 'Ricerca in corso...';
    }
    
    if (req.url.includes('/upload')) {
      return 'Caricamento file...';
    }

    // Generic messages based on HTTP method
    switch (req.method) {
      case 'GET':
        return 'Caricamento...';
      case 'POST':
        return 'Creazione...';
      case 'PUT':
      case 'PATCH':
        return 'Aggiornamento...';
      case 'DELETE':
        return 'Eliminazione...';
      default:
        return 'Elaborazione...';
    }
  }

  /**
   * Check if loading should be skipped for this request
   */
  private shouldSkipLoading(req: HttpRequest<any>): boolean {
    // Skip if request has specific header
    if (req.headers.has('Skip-Loading')) {
      return true;
    }

    // Skip for certain URLs
    const skipUrls = [
      '/api/health',
      '/api/ping',
      '/api/heartbeat'
    ];

    if (skipUrls.some(url => req.url.includes(url))) {
      return true;
    }

    // Skip for very quick operations
    if (req.method === 'HEAD' || req.method === 'OPTIONS') {
      return true;
    }

    return false;
  }

  /**
   * Calculate minimum delay to prevent flashing
   */
  private calculateMinDelay(startTime: number): number {
    const elapsed = Date.now() - startTime;
    return Math.max(0, this.MIN_LOADING_TIME - elapsed);
  }
}