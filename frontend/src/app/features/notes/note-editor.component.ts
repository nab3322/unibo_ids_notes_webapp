import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoteService } from '../../core/services/note.service';
import { FolderService } from '../../core/services/folder.service';
import { Note, NoteVersion } from '../../core/models/note.model';
import { Folder } from '../../core/models/folder.model';

@Component({
  selector: 'app-note-editor',
  template: `
    <div class="editor-container">
      <div class="header-row">
        <h1>{{getTitle()}}</h1>
        <div class="header-actions">
          <span *ngIf="isReadOnly" class="read-only-badge">
            <mat-icon>visibility</mat-icon>
            Solo lettura
          </span>
          <button *ngIf="isEditing && isOwner" mat-stroked-button color="primary"
                  (click)="toggleVersions()" type="button">
            <mat-icon>history</mat-icon>
            {{ showVersions ? 'Nascondi Versioni' : 'Cronologia Versioni' }}
          </button>
        </div>
      </div>

      <div *ngIf="isLoading" style="text-align: center; margin: 20px;">
        <p>Caricamento...</p>
      </div>

      <!-- Versions Panel -->
      <mat-card *ngIf="showVersions && isEditing" class="versions-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>history</mat-icon>
          <mat-card-title>Cronologia Versioni</mat-card-title>
          <mat-card-subtitle>Seleziona una versione per visualizzarla o ripristinarla</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div *ngIf="isLoadingVersions" class="loading-versions">
            <mat-spinner diameter="30"></mat-spinner>
            <span>Caricamento versioni...</span>
          </div>
          <mat-list *ngIf="!isLoadingVersions && versions.length > 0">
            <mat-list-item *ngFor="let version of versions"
                           [class.selected]="selectedVersion?.versionNumber === version.versionNumber"
                           (click)="selectVersion(version)">
              <mat-icon matListItemIcon>description</mat-icon>
              <div matListItemTitle>Versione {{ version.versionNumber }} - {{ version.modifiedByUsername || 'Sconosciuto' }}</div>
              <div matListItemLine>{{ formatDate(version.modifiedAt) }}</div>
              <button mat-icon-button matListItemMeta color="primary"
                      (click)="restoreVersion(version); $event.stopPropagation()"
                      matTooltip="Ripristina questa versione"
                      [disabled]="isRestoring">
                <mat-icon>restore</mat-icon>
              </button>
            </mat-list-item>
          </mat-list>
          <div *ngIf="!isLoadingVersions && versions.length === 0" class="no-versions">
            <mat-icon>info</mat-icon>
            <p>Nessuna versione precedente disponibile</p>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Selected Version Preview -->
      <mat-card *ngIf="selectedVersion" class="version-preview-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>preview</mat-icon>
          <mat-card-title>Anteprima Versione {{ selectedVersion.versionNumber }}</mat-card-title>
          <mat-card-subtitle>{{ formatDate(selectedVersion.modifiedAt) }} - Modificata da {{ selectedVersion.modifiedByUsername || 'Sconosciuto' }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="version-content">{{ selectedVersion.content }}</div>
        </mat-card-content>
        <mat-card-actions align="end">
          <button mat-button (click)="selectedVersion = null">Chiudi anteprima</button>
          <button mat-raised-button color="primary" (click)="restoreVersion(selectedVersion)"
                  [disabled]="isRestoring">
            <mat-icon>restore</mat-icon>
            Ripristina questa versione
          </button>
        </mat-card-actions>
      </mat-card>

      <!-- Read-only view for shared notes -->
      <mat-card class="editor-card" *ngIf="!isLoading && isReadOnly">
        <div class="read-only-note">
          <div class="note-field">
            <label>Titolo</label>
            <h2>{{ noteForm.get('title')?.value }}</h2>
          </div>
          <div class="note-field">
            <label>Contenuto</label>
            <div class="note-content">{{ noteForm.get('content')?.value }}</div>
          </div>
          <div class="note-field" *ngIf="currentFolderName">
            <label>Cartella</label>
            <p>{{ currentFolderName }}</p>
          </div>
          <div class="actions">
            <button mat-raised-button color="primary" (click)="onCancel()">
              <mat-icon>arrow_back</mat-icon>
              Torna alle note
            </button>
          </div>
        </div>
      </mat-card>

      <!-- Editable form -->
      <mat-card class="editor-card" *ngIf="!isLoading && !isReadOnly">
        <form [formGroup]="noteForm" (ngSubmit)="onSave()">

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Titolo</mat-label>
            <input matInput formControlName="title" placeholder="Inserisci il titolo...">
            <mat-error *ngIf="noteForm.get('title')?.hasError('required')">Titolo obbligatorio</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Contenuto</mat-label>
            <textarea matInput formControlName="content" rows="10"
                      placeholder="Scrivi qui i tuoi pensieri..."></textarea>
            <mat-error *ngIf="noteForm.get('content')?.hasError('required')">Contenuto obbligatorio</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Cartella (opzionale)</mat-label>
            <mat-select formControlName="folderId">
              <mat-option [value]="null">Nessuna cartella</mat-option>
              <mat-option *ngFor="let folder of folders" [value]="folder.id">
                {{ folder.name }}
              </mat-option>
            </mat-select>
            <mat-hint>Seleziona una cartella per organizzare la nota</mat-hint>
          </mat-form-field>

          <div class="actions">
            <button mat-button type="button" (click)="onCancel()">Annulla</button>
            <button mat-raised-button color="primary" type="submit"
                    [disabled]="!noteForm.valid || isSaving">
              {{ isSaving ? 'Salvataggio...' : (isEditing ? 'Aggiorna' : 'Salva') }}
            </button>
          </div>
        </form>
      </mat-card>
    </div>
  `,
  styles: [`
    .editor-container { padding: 20px; max-width: 800px; margin: 0 auto; }
    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .header-row h1 { margin: 0; }
    .header-actions { display: flex; align-items: center; gap: 12px; }
    .read-only-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      background: #ff9800;
      color: white;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 14px;
    }
    .full-width { width: 100%; margin-bottom: 20px; }
    .actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
    .versions-card { margin-bottom: 20px; }
    .versions-card mat-list-item { cursor: pointer; }
    .versions-card mat-list-item:hover { background-color: #f5f5f5; }
    .versions-card mat-list-item.selected { background-color: #e3f2fd; }
    .loading-versions { display: flex; align-items: center; gap: 12px; padding: 16px; }
    .no-versions { display: flex; align-items: center; gap: 8px; color: #666; padding: 16px; }
    .version-preview-card { margin-bottom: 20px; border: 2px solid #3f51b5; }
    .version-content {
      white-space: pre-wrap;
      background: #fafafa;
      padding: 16px;
      border-radius: 4px;
      max-height: 200px;
      overflow-y: auto;
    }
    .read-only-note { padding: 16px; }
    .note-field { margin-bottom: 24px; }
    .note-field label {
      display: block;
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    .note-field h2 { margin: 0; }
    .note-field p { margin: 0; }
    .note-content {
      white-space: pre-wrap;
      background: #fafafa;
      padding: 16px;
      border-radius: 4px;
      min-height: 200px;
      border: 1px solid #e0e0e0;
    }
  `]
})
export class NoteEditorComponent implements OnInit {
  noteForm: FormGroup;
  isEditing = false;
  noteId: string | null = null;
  isLoading = false;
  isSaving = false;
  folders: Folder[] = [];
  isOwner = false;
  canEdit = true;
  isReadOnly = false;
  currentFolderName: string | null = null;

  // Versioning
  showVersions = false;
  versions: NoteVersion[] = [];
  selectedVersion: NoteVersion | null = null;
  isLoadingVersions = false;
  isRestoring = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private noteService: NoteService,
    private folderService: FolderService,
    private snackBar: MatSnackBar
  ) {
    this.noteForm = this.fb.group({
      title: ['', [Validators.required]],
      content: ['', [Validators.required]],
      folderId: [null]
    });
  }

  ngOnInit(): void {
    // Carica le cartelle disponibili
    this.loadFolders();

    // Controlla se siamo in modalità modifica
    this.noteId = this.route.snapshot.paramMap.get('id');

    if (this.noteId) {
      this.isEditing = true;
      this.loadNote(this.noteId);
    } else {
      // Controlla se c'è un folderId nei query params
      const folderId = this.route.snapshot.queryParamMap.get('folderId');
      if (folderId) {
        this.noteForm.patchValue({ folderId: Number(folderId) });
      }
    }
  }

  loadFolders(): void {
    this.folderService.getRootFolders().subscribe({
      next: (folders) => {
        this.folders = folders;
      },
      error: (err) => {
        console.error('Errore caricamento cartelle:', err);
      }
    });
  }

  loadNote(id: string): void {
    this.isLoading = true;
    this.noteService.getNote(id).subscribe({
      next: (note: Note) => {
        this.noteForm.patchValue({
          title: note.title,
          content: note.content,
          folderId: note.folderId || null
        });
        // Check if user is owner (canDelete means owner)
        this.isOwner = note.canDelete === true;
        // Check if user can edit
        this.canEdit = note.canEdit === true;
        this.isReadOnly = !this.canEdit;
        this.currentFolderName = note.folderName || null;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.showError('Impossibile caricare la nota');
        this.router.navigate(['/notes']);
      }
    });
  }

  getTitle(): string {
    if (!this.isEditing) return 'Nuova Nota';
    if (this.isReadOnly) return 'Visualizza Nota';
    return 'Modifica Nota';
  }

  toggleVersions(): void {
    this.showVersions = !this.showVersions;
    if (this.showVersions && this.versions.length === 0) {
      this.loadVersions();
    }
  }

  loadVersions(): void {
    if (!this.noteId) return;
    this.isLoadingVersions = true;
    this.noteService.getVersions(this.noteId).subscribe({
      next: (versions) => {
        this.versions = versions;
        this.isLoadingVersions = false;
      },
      error: (err) => {
        console.error('Errore caricamento versioni:', err);
        this.showError('Impossibile caricare le versioni');
        this.isLoadingVersions = false;
      }
    });
  }

  selectVersion(version: NoteVersion): void {
    this.selectedVersion = version;
  }

  restoreVersion(version: NoteVersion): void {
    if (!this.noteId) return;
    this.isRestoring = true;
    this.noteService.restoreVersion(this.noteId, version.versionNumber).subscribe({
      next: (note) => {
        this.noteForm.patchValue({
          title: note.title,
          content: note.content
        });
        this.selectedVersion = null;
        this.showSuccess('Versione ripristinata con successo!');
        this.isRestoring = false;
        // Ricarica le versioni
        this.loadVersions();
      },
      error: (err) => {
        console.error('Errore ripristino versione:', err);
        this.showError('Impossibile ripristinare la versione');
        this.isRestoring = false;
      }
    });
  }

  formatDate(dateStr: string | Date): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Rome'
    });
  }

  onSave(): void {
    if (this.noteForm.invalid) return;

    this.isSaving = true;
    const formData = this.noteForm.value;

    if (this.isEditing && this.noteId) {
      this.noteService.updateNote(this.noteId, formData).subscribe({
        next: () => {
          this.showSuccess('Nota aggiornata!');
          this.router.navigate(['/notes']);
        },
        error: (err) => {
          this.showError('Errore aggiornamento nota');
          this.isSaving = false;
        }
      });
    } else {
      this.noteService.createNote(formData).subscribe({
        next: () => {
          this.showSuccess('Nota creata!');
          this.router.navigate(['/notes']);
        },
        error: (err) => {
          this.showError('Errore creazione nota');
          this.isSaving = false;
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/notes']);
  }

  private showSuccess(msg: string) {
    this.snackBar.open(msg, 'OK', { duration: 3000, panelClass: ['success-snackbar'] });
  }

  private showError(msg: string) {
    this.snackBar.open(msg, 'Chiudi', { duration: 5000, panelClass: ['error-snackbar'] });
  }
}
