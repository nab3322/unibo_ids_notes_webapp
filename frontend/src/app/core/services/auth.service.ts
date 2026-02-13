import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User, AuthResponse, LoginRequest, RegisterRequest, UserRole } from '../models/user.model';
// 👇 IMPORTANTE: Importiamo l'environment per leggere l'URL configurato
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // 👇 MODIFICA FONDAMENTALE:
  // Non scriviamo più l'URL a mano. Usiamo quello definito in environment.prod.ts
  // Questo prenderà 'http://localhost:8080' (senza /api)
  private readonly API_URL = environment.apiUrl;

  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'current_user';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuth();
  }

  /**
   * Inizializza l'autenticazione controllando il localStorage
   */
  private initializeAuth(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userData = localStorage.getItem(this.USER_KEY);

    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
      } catch (error) {
        this.logout().subscribe();
      }
    }
  }

  /**
   * Metodo login che accetta un solo parametro LoginRequest
   */
  login(loginRequest: LoginRequest): Observable<AuthResponse> {
    // Risultato sarà: http://localhost:8080/auth/login
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, loginRequest)
      .pipe(
        tap(response => {
          this.setAuthData(response);
        }),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Overload per supportare email e password separati (backward compatibility)
   */
  loginWithCredentials(email: string, password: string): Observable<AuthResponse> {
    const loginRequest: LoginRequest = {
      username: email,
      password: password
    };
    return this.login(loginRequest);
  }

  /**
   * Registrazione utente
   */
  register(registerRequest: RegisterRequest): Observable<AuthResponse> {
    // Risultato sarà: http://localhost:8080/auth/register
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/register`, registerRequest)
      .pipe(
        tap(response => {
          this.setAuthData(response);
        }),
        catchError(error => {
          console.error('Register error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Metodo isLoggedIn richiesto dal template
   */
  isLoggedIn(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Ottiene l'utente corrente
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Ottiene il token di autenticazione
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Ottiene il refresh token (richiesto da auth.guard.ts)
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Verifica se l'utente ha uno dei ruoli richiesti
   */
  hasAnyRole(roles: (UserRole | string)[]): boolean {
    const user = this.getCurrentUser();
    if (!user || !user.role) return false;

    const roleStrings = roles.map(role => role.toString());
    const userRoleString = user.role.toString();

    return roleStrings.includes(userRoleString);
  }

  /**
   * Verifica se l'utente ha un ruolo specifico
   */
  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Logout che restituisce Observable
   */
  logout(): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/logout`, {}).pipe(
      tap(() => {
        this.clearAuthData();
      }),
      catchError(() => {
        this.clearAuthData();
        return throwError(() => new Error('Logout failed'));
      })
    );
  }

  logoutLocal(): void {
    this.clearAuthData();
  }

  /**
   * Refresh del token
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      this.clearAuthData();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<AuthResponse>(`${this.API_URL}/auth/refresh`, { refreshToken })
      .pipe(
        tap(response => {
          this.setAuthData(response);
        }),
        catchError(error => {
          this.clearAuthData();
          return throwError(() => error);
        })
      );
  }

  /**
   * Verifica se il token è scaduto
   */
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  /**
   * Aggiorna il profilo utente
   */
  updateProfile(user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/auth/profile`, user)
      .pipe(
        tap(updatedUser => {
          this.currentUserSubject.next(updatedUser);
          localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
        })
      );
  }

  /**
   * Cambia password
   */
  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/change-password`, {
      currentPassword,
      newPassword
    });
  }

  /**
   * Imposta i dati di autenticazione
   */
  private setAuthData(authResponse: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, authResponse.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(authResponse.user));
    localStorage.setItem(this.REFRESH_TOKEN_KEY, authResponse.refreshToken);

    this.currentUserSubject.next(authResponse.user);
    this.isAuthenticatedSubject.next(true);
  }

  /**
   * Cancella i dati di autenticazione
   */
  private clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);

    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);

    this.router.navigate(['/login']);
  }
}
