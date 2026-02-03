import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class GuestGuard implements CanActivate, CanActivateChild {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Can activate route (for guest/unauthenticated users only)
   */
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.checkGuestAccess();
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
   * Check if user should have guest access (not authenticated)
   */
  private checkGuestAccess(): Observable<boolean> {
    return this.authService.isAuthenticated$.pipe(
      take(1),
      map(isAuthenticated => {
        if (isAuthenticated) {
          // User is authenticated, redirect to dashboard
          this.router.navigate(['/dashboard'], {
            replaceUrl: true
          });
          return false;
        }
        
        // User is not authenticated, allow access
        return true;
      })
    );
  }
}