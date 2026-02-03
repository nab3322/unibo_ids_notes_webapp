import { Component, EventEmitter, Output, Input } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Input() sidebarOpen = false;
  @Input() user: User | null = null;
  @Input() isDarkTheme = false;

  @Output() menuToggle = new EventEmitter<void>();
  @Output() themeToggle = new EventEmitter<void>();

  constructor(
    public router: Router,
    private authService: AuthService
  ) {}

  onMenuToggle(): void {
    this.menuToggle.emit();
  }

  onSearch(searchTerm: string): void {
    if (searchTerm.trim()) {
      this.router.navigate(['/search'], {
        queryParams: { q: searchTerm.trim() }
      });
    }
  }

  onProfileClick(): void {
    this.router.navigate(['/settings']);
  }

  onThemeToggle(): void {
    this.themeToggle.emit();
  }

  /**
   * Gestisce il logout immediato
   */
  onLogout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      },
      error: () => {
        // In caso di errore, effettua comunque il logout locale
        this.authService.logoutLocal();
        this.router.navigate(['/auth/login']);
      }
    });
  }
}
