import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from './core/services/auth.service';
import { LoadingService } from './core/services/loading.service';
import { FolderService } from './core/services/folder.service';
import { InputDialogComponent, InputDialogData } from './shared/components/input-dialog/input-dialog.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  appName = 'Notes App';
  sidebarOpen = true;
  isLoading$: Observable<boolean>;
  isAuthenticated$: Observable<boolean>;

  constructor(
    public authService: AuthService,
    private loadingService: LoadingService,
    private folderService: FolderService,
    private router: Router,
    private dialog: MatDialog
  ) {
    this.isLoading$ = this.loadingService.loading$;
    this.isAuthenticated$ = this.authService.isAuthenticated$;
  }

  ngOnInit() {
    if (window.innerWidth < 768) {
      this.sidebarOpen = false;
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  createNewNote(): void {
    this.router.navigate(['/notes/new']);
    if (window.innerWidth < 768) this.sidebarOpen = false;
  }

  createNewFolder(): void {
    const dialogData: InputDialogData = {
      title: 'Nuova Cartella',
      message: 'Inserisci il nome della nuova cartella',
      inputLabel: 'Nome cartella',
      inputPlaceholder: 'Es. Lavoro, Personale, Progetti...',
      confirmText: 'Crea',
      cancelText: 'Annulla',
      maxLength: 100,
      required: true
    };

    const dialogRef = this.dialog.open(InputDialogComponent, {
      width: '400px',
      data: dialogData,
      autoFocus: 'first-tabbable',
      restoreFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.trim()) {
        this.folderService.createFolder(result.trim()).subscribe({
          next: () => {
            if (this.router.url === '/folders') {
              this.router.navigateByUrl('/', {skipLocationChange: true}).then(() =>
                 this.router.navigate(['/folders']));
            } else {
               this.router.navigate(['/folders']);
            }
          },
          error: (err) => console.error('Errore creazione cartella:', err)
        });
      }
    });
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/auth/login']);
    });
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
    if (window.innerWidth < 768) this.sidebarOpen = false;
  }
}
