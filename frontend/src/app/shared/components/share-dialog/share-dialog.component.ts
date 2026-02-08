import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { PermissionService } from '../../../core/services/permission.service';
import { Permission } from '../../../core/models/permission.model';

interface UserResult {
  id: number;
  username: string;
}

export interface ShareDialogData {
  noteId: number;
  noteTitle: string;
}

@Component({
  selector: 'app-share-dialog',
  template: `
    <h2 mat-dialog-title>Condividi Nota</h2>
    <mat-dialog-content>
      <p class="note-info">Stai condividendo: <strong>{{ data.noteTitle }}</strong></p>

      <!-- Existing Permissions Section -->
      <div class="existing-permissions" *ngIf="existingPermissions.length > 0">
        <h3>Permessi attuali</h3>
        <div class="permission-list">
          <div class="permission-item" *ngFor="let perm of existingPermissions">
            <div class="user-info">
              <mat-icon>person</mat-icon>
              <span class="username">{{ perm.username }}</span>
            </div>
            <div class="permission-actions">
              <mat-form-field appearance="outline" class="permission-select">
                <mat-select [value]="perm.permissionType"
                            (selectionChange)="onPermissionChange(perm, $event.value)"
                            [disabled]="updatingPermission === perm.userId">
                  <mat-option value="READ">
                    <mat-icon>visibility</mat-icon>
                    Solo lettura
                  </mat-option>
                  <mat-option value="WRITE">
                    <mat-icon>edit</mat-icon>
                    Lettura e scrittura
                  </mat-option>
                </mat-select>
              </mat-form-field>
              <button mat-icon-button color="warn"
                      (click)="onRevokePermission(perm)"
                      [disabled]="revokingPermission === perm.userId"
                      matTooltip="Rimuovi permesso">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="isLoadingPermissions" class="loading-permissions">
        <mat-spinner diameter="24"></mat-spinner>
        <span>Caricamento permessi...</span>
      </div>

      <mat-divider *ngIf="existingPermissions.length > 0" class="section-divider"></mat-divider>

      <h3 *ngIf="existingPermissions.length > 0">Aggiungi nuovo utente</h3>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Cerca utente</mat-label>
        <input matInput
               [formControl]="userSearchControl"
               [matAutocomplete]="auto"
               placeholder="Digita il nome utente...">
        <mat-icon matSuffix>person_search</mat-icon>
        <mat-autocomplete #auto="matAutocomplete"
                          [displayWith]="displayFn"
                          (optionSelected)="onUserSelected($event)">
          <mat-option *ngFor="let user of filteredUsers$ | async" [value]="user">
            <mat-icon>person</mat-icon>
            {{ user.username }}
          </mat-option>
          <mat-option *ngIf="isSearching" disabled>
            <mat-spinner diameter="20"></mat-spinner>
            Ricerca in corso...
          </mat-option>
          <mat-option *ngIf="!isSearching && noResults" disabled>
            Nessun utente trovato
          </mat-option>
        </mat-autocomplete>
        <mat-hint>Inserisci almeno 2 caratteri per cercare</mat-hint>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width" *ngIf="selectedUser">
        <mat-label>Permesso</mat-label>
        <mat-select [formControl]="permissionControl">
          <mat-option value="READ">
            <mat-icon>visibility</mat-icon>
            Solo lettura
          </mat-option>
          <mat-option value="WRITE">
            <mat-icon>edit</mat-icon>
            Lettura e scrittura
          </mat-option>
        </mat-select>
      </mat-form-field>

      <div *ngIf="selectedUser" class="selected-user">
        <mat-icon>check_circle</mat-icon>
        <span>Utente selezionato: <strong>{{ selectedUser.username }}</strong></span>
      </div>

      <div *ngIf="errorMessage" class="error-message">
        <mat-icon>error</mat-icon>
        {{ errorMessage }}
      </div>

      <div *ngIf="successMessage" class="success-message">
        <mat-icon>check_circle</mat-icon>
        {{ successMessage }}
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Chiudi</button>
      <button mat-raised-button
              color="primary"
              [disabled]="!selectedUser || isSharing"
              (click)="onShare()">
        <mat-icon>share</mat-icon>
        {{ isSharing ? 'Condivisione...' : 'Condividi' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .note-info {
      margin-bottom: 20px;
      color: #666;

      strong {
        color: #333;
      }
    }

    .existing-permissions {
      margin-bottom: 16px;

      h3 {
        margin: 0 0 12px 0;
        font-size: 14px;
        color: #666;
      }
    }

    .permission-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .permission-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background-color: #f5f5f5;
      border-radius: 8px;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;

      mat-icon {
        color: #666;
      }

      .username {
        font-weight: 500;
      }
    }

    .permission-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .permission-select {
      width: 160px;
      margin-bottom: 0;

      ::ng-deep .mat-mdc-form-field-subscript-wrapper {
        display: none;
      }
    }

    .loading-permissions {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      color: #666;
    }

    .section-divider {
      margin: 20px 0;
    }

    h3 {
      margin: 0 0 16px 0;
      font-size: 14px;
      color: #666;
    }

    .selected-user {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background-color: #e3f2fd;
      border-radius: 8px;
      margin-bottom: 16px;

      mat-icon {
        color: #1976d2;
      }

      strong {
        color: #1976d2;
      }
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background-color: #ffebee;
      border-radius: 8px;
      color: #c62828;
      margin-bottom: 16px;
    }

    .success-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background-color: #e8f5e9;
      border-radius: 8px;
      color: #2e7d32;
      margin-bottom: 16px;
    }

    mat-dialog-content {
      min-width: 450px;
      max-height: 70vh;
    }

    mat-option mat-icon {
      margin-right: 8px;
    }
  `]
})
export class ShareDialogComponent implements OnInit {
  userSearchControl = new FormControl('');
  permissionControl = new FormControl('READ');
  filteredUsers$: Observable<UserResult[]> = of([]);
  selectedUser: UserResult | null = null;
  isSearching = false;
  isSharing = false;
  noResults = false;
  errorMessage = '';
  successMessage = '';

  // Permission management
  existingPermissions: Permission[] = [];
  isLoadingPermissions = false;
  updatingPermission: number | null = null;
  revokingPermission: number | null = null;

  constructor(
    public dialogRef: MatDialogRef<ShareDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ShareDialogData,
    private http: HttpClient,
    private permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.loadExistingPermissions();

    this.filteredUsers$ = this.userSearchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        if (typeof value === 'string' && value.length >= 2) {
          this.isSearching = true;
          this.noResults = false;
          return this.searchUsers(value);
        }
        this.isSearching = false;
        this.noResults = false;
        return of([]);
      })
    );
  }

  loadExistingPermissions(): void {
    this.isLoadingPermissions = true;
    this.permissionService.getNotePermissions(this.data.noteId).subscribe({
      next: (permissions) => {
        this.existingPermissions = permissions;
        this.isLoadingPermissions = false;
      },
      error: (err) => {
        console.error('Errore caricamento permessi:', err);
        this.isLoadingPermissions = false;
      }
    });
  }

  onPermissionChange(permission: Permission, newPermissionType: string): void {
    this.updatingPermission = permission.userId;
    this.errorMessage = '';
    this.successMessage = '';

    this.permissionService.updatePermission(this.data.noteId, permission.userId, newPermissionType).subscribe({
      next: () => {
        // Update local list
        const index = this.existingPermissions.findIndex(p => p.userId === permission.userId);
        if (index !== -1) {
          this.existingPermissions[index] = {
            ...this.existingPermissions[index],
            permissionType: newPermissionType as any
          };
        }
        this.successMessage = `Permesso di ${permission.username} aggiornato!`;
        this.updatingPermission = null;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        console.error('Errore aggiornamento permesso:', err);
        this.errorMessage = err.error?.message || 'Errore durante l\'aggiornamento del permesso.';
        this.updatingPermission = null;
      }
    });
  }

  onRevokePermission(permission: Permission): void {
    this.revokingPermission = permission.userId;
    this.errorMessage = '';
    this.successMessage = '';

    this.permissionService.revokePermission(this.data.noteId, permission.userId).subscribe({
      next: () => {
        // Remove from local list
        this.existingPermissions = this.existingPermissions.filter(p => p.userId !== permission.userId);
        this.successMessage = `Permesso di ${permission.username} rimosso!`;
        this.revokingPermission = null;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        console.error('Errore rimozione permesso:', err);
        this.errorMessage = err.error?.message || 'Errore durante la rimozione del permesso.';
        this.revokingPermission = null;
      }
    });
  }

  searchUsers(query: string): Observable<UserResult[]> {
    return this.http.get<UserResult[]>(`${environment.apiUrl}/users/search?q=${encodeURIComponent(query)}`)
      .pipe(
        switchMap(users => {
          this.isSearching = false;
          this.noResults = users.length === 0;
          // Filter out users who already have permission
          const existingUserIds = this.existingPermissions.map(p => p.userId);
          const filteredUsers = users.filter(u => !existingUserIds.includes(u.id));
          this.noResults = filteredUsers.length === 0;
          return of(filteredUsers);
        }),
        catchError(() => {
          this.isSearching = false;
          this.noResults = true;
          return of([]);
        })
      );
  }

  displayFn(user: UserResult): string {
    return user ? user.username : '';
  }

  onUserSelected(event: any): void {
    this.selectedUser = event.option.value;
    this.errorMessage = '';
    this.successMessage = '';
  }

  onShare(): void {
    if (!this.selectedUser) return;

    this.isSharing = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      username: this.selectedUser.username,
      permission: this.permissionControl.value
    };

    this.http.post(`${environment.apiUrl}/permissions/notes/${this.data.noteId}/share`, payload)
      .subscribe({
        next: (newPermission: any) => {
          this.successMessage = `Nota condivisa con ${this.selectedUser!.username}!`;
          this.isSharing = false;
          // Add to existing permissions list
          this.existingPermissions.push({
            ...newPermission,
            username: this.selectedUser!.username
          });
          // Clear selection
          this.selectedUser = null;
          this.userSearchControl.setValue('');
          this.permissionControl.setValue('READ');
        },
        error: (err) => {
          console.error('Errore condivisione:', err);
          this.errorMessage = err.error?.message || 'Errore durante la condivisione. Riprova.';
          this.isSharing = false;
        }
      });
  }

  onCancel(): void {
    this.dialogRef.close(this.existingPermissions.length > 0);
  }
}
