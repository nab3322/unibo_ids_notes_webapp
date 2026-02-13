import { Injectable, Injector } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  constructor(private injector: Injector) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const authService = this.injector.get(AuthService);

    // Skip auth for certain requests
    if (this.shouldSkipAuth(req)) {
      return next.handle(req);
    }

    const authReq = this.addTokenToRequest(req, authService);

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 unauthorized errors
        if (error.status === 401 && !this.isAuthRequest(req)) {
          return this.handle401Error(authReq, next, authService);
        }

        return throwError(() => error);
      })
    );
  }

  private addTokenToRequest(req: HttpRequest<any>, authService: AuthService): HttpRequest<any> {
    // Ora possiamo chiamare getToken() su un'istanza valida
    const token = authService.getToken();

    if (token) {
      return req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return req;
  }

  private handle401Error(req: HttpRequest<any>, next: HttpHandler, authService: AuthService): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      const refreshToken = authService.getRefreshToken(); // Uso istanza passata

      if (refreshToken) {
        return authService.refreshToken().pipe(
          switchMap((tokenResponse: any) => {
            this.isRefreshing = false;
            // Adattiamo in base a cosa restituisce il backend (AuthResponse ha il campo 'token')
            const newToken = tokenResponse.token || tokenResponse;
            this.refreshTokenSubject.next(newToken);

            // Retry the original request with new token
            const newAuthReq = this.addTokenToRequest(req, authService);
            return next.handle(newAuthReq);
          }),
          catchError((error) => {
            this.isRefreshing = false;
            this.refreshTokenSubject.next(null);

            // Refresh failed, logout user
            authService.logout().subscribe();

            return throwError(() => error);
          })
        );
      } else {
        // No refresh token, logout user
        this.isRefreshing = false;
        authService.logout().subscribe();
        return throwError(() => new Error('No refresh token available'));
      }
    } else {
      // Token refresh is in progress, wait for it to complete
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(() => {
          const newAuthReq = this.addTokenToRequest(req, authService);
          return next.handle(newAuthReq);
        })
      );
    }
  }
  private shouldSkipAuth(req: HttpRequest<any>): boolean {
    const skipAuthUrls = [
      '/auth/login',
      '/auth/register',
      '/auth/refresh',
      '/auth/forgot-password',
      '/auth/reset-password'
    ];

    return skipAuthUrls.some(url => req.url.includes(url)) ||
           req.headers.has('Skip-Auth') ||
           req.headers.has('No-Auth');
  }

  private isAuthRequest(req: HttpRequest<any>): boolean {
    return req.url.includes('/auth/');
  }
}
