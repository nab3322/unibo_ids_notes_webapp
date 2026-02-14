import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../core/services/auth.service';
import { FolderService } from '../core/services/folder.service';
import { User } from '../core/models/user.model';
import { InputDialogComponent, InputDialogData } from '../shared/components/input-dialog/input-dialog.component';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit {
  sidebarOpen = true;

  @Output() sidebarToggle = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  currentUser$: Observable<User | null>;

  constructor(
    private authService: AuthService,
    private folderService: FolderService,
    private router: Router,
    private dialog: MatDialog
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void { }

  onSidebarToggle(): void {
    this.sidebarOpen = !this.sidebarOpen;
    this.sidebarToggle.emit();
  }

  onLogout(): void {
    this.authService.logout().subscribe(() => {
      this.logout.emit();
      this.router.navigate(['/auth/login']);
    });
  }

  onCreateNote(): void {
    this.router.navigate(['/notes/new']);
  }

  onCreateFolder(): void {
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
            if (this.router.url.includes('/folders')) {
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
}
