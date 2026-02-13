import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private loadingRequestsCount = 0;
  private loadingOperations = new Map<string, boolean>(); // ✅ Per tracciare operazioni specifiche

  /**
   * Observable per il stato di loading
   */
  public loading$: Observable<boolean> = this.loadingSubject.asObservable();

  constructor() {}

  /**
   * Metodo show richiesto dall'app.component.ts
   */
  show(): void {
    this.loadingRequestsCount++;
    this.updateLoadingState();
  }

  /**
   * Metodo hide richiesto dall'app.component.ts
   */
  hide(): void {
    if (this.loadingRequestsCount > 0) {
      this.loadingRequestsCount--;
    }
    this.updateLoadingState();
  }

  /**
   * Metodo start richiesto dal loading.interceptor.ts
   */
  start(key: string, message?: string): void {
    this.loadingOperations.set(key, true);
    this.updateLoadingState();
    
    if (message) {
      console.log(`Loading started: ${message}`);
    }
  }

  /**
   * Metodo stop richiesto dal loading.interceptor.ts
   */
  stop(key: string): void {
    this.loadingOperations.delete(key);
    this.updateLoadingState();
  }

  /**
   * Forza lo stop del loading (utile per errori)
   */
  forceHide(): void {
    this.loadingRequestsCount = 0;
    this.loadingOperations.clear();
    this.updateLoadingState();
  }

  /**
   * Ottiene lo stato corrente del loading
   */
  isLoading(): boolean {
    return this.loadingSubject.value;
  }

  /**
   * Verifica se un'operazione specifica è in loading
   */
  isOperationLoading(key: string): boolean {
    return this.loadingOperations.has(key);
  }

  /**
   * Ottiene tutte le operazioni in loading
   */
  getLoadingOperations(): string[] {
    return Array.from(this.loadingOperations.keys());
  }

  /**
   * Mostra loading per una Promise specifica
   */
  showForPromise<T>(promise: Promise<T>, key?: string): Promise<T> {
    const loadingKey = key || `promise_${Date.now()}`;
    this.start(loadingKey);
    
    return promise.finally(() => this.stop(loadingKey));
  }

  /**
   * Mostra loading per un Observable specifico
   */
  showForObservable<T>(observable: Observable<T>, key?: string): Observable<T> {
    const loadingKey = key || `observable_${Date.now()}`;
    this.start(loadingKey);
    
    return new Observable(subscriber => {
      const subscription = observable.subscribe({
        next: value => subscriber.next(value),
        error: error => {
          this.stop(loadingKey);
          subscriber.error(error);
        },
        complete: () => {
          this.stop(loadingKey);
          subscriber.complete();
        }
      });

      return () => {
        subscription.unsubscribe();
        this.stop(loadingKey);
      };
    });
  }

  /**
   * Metodo per operazioni HTTP con timeout
   */
  startWithTimeout(key: string, timeoutMs: number = 30000): void {
    this.start(key);
    
    setTimeout(() => {
      if (this.isOperationLoading(key)) {
        console.warn(`Loading operation '${key}' timed out after ${timeoutMs}ms`);
        this.stop(key);
      }
    }, timeoutMs);
  }

  /**
   * Aggiorna lo stato del loading
   */
  private updateLoadingState(): void {
    const isLoading = this.loadingRequestsCount > 0 || this.loadingOperations.size > 0;
    this.loadingSubject.next(isLoading);
  }
}