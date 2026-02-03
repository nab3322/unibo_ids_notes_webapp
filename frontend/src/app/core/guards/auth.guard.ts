import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, CanLoad, Router, ActivatedRouteSnapshot, RouterStateSnapshot, Route, UrlSegment } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, take, switchMap, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild, CanLoad {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Can activate route
   */
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.checkAuthentication(state.url, route.data?.['roles']);
  }

  /**
   * Can activate child route
   */
  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.canActivate(childRoute, state);
  }

  /**
   * Can load lazy module
   */
  canLoad(
    route: Route,
    segments: UrlSegment[]
  ): Observable<boolean> {
    const url = `/${segments.map(s => s.path).join('/')}`;
    return this.checkAuthentication(url, route.data?.['roles']);
  }

  /**
   * Check authentication and authorization
   */
  private checkAuthentication(url: string, requiredRoles?: string[]): Observable<boolean> {
    return this.authService.isAuthenticated$.pipe(
      take(1),
      switchMap(isAuthenticated => {
        if (!isAuthenticated) {
          // Try to refresh token if available
          const refreshToken = this.authService.getRefreshToken();
          if (refreshToken) {
            return this.authService.refreshToken().pipe(
              map(() => true),
              catchError(() => {
                this.redirectToLogin(url);
                return of(false);
              })
            );
          } else {
            this.redirectToLogin(url);
            return of(false);
          }
        }

        // Check role-based authorization
        if (requiredRoles && requiredRoles.length > 0) {
          const hasRequiredRole = this.authService.hasAnyRole(requiredRoles);
          if (!hasRequiredRole) {
            this.redirectToUnauthorized();
            return of(false);
          }
        }

        return of(true);
      })
    );
  }

  /**
   * Redirect to login page
   */
  private redirectToLogin(returnUrl: string): void {
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl },
      replaceUrl: true
    });
  }

  /**
   * Redirect to unauthorized page
   */
  private redirectToUnauthorized(): void {
    this.router.navigate(['/unauthorized'], {
      replaceUrl: true
    });
  }
}
