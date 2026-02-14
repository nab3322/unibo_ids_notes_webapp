import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface SharedNote {
  id: number;
  title: string;
  content: string;
  ownerUsername: string;
  createdAt: string;
  updatedAt: string;
  folderName?: string;
}

interface NoteListResponse {
  notes: SharedNote[];
}

@Component({
  selector: 'app-shared-notes-list',
  template: `
    <div class="shared-container">
      <div class="page-header">
        <h1>Condivise con me</h1>
        <p class="subtitle">Note che altri utenti hanno condiviso con te</p>
      </div>

      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Caricamento note condivise...</p>
      </div>

      <div *ngIf="!isLoading && sharedNotes.length === 0" class="empty-state">
        <mat-icon class="empty-icon">share</mat-icon>
        <h2>Nessuna nota condivisa</h2>
        <p>Non hai ancora ricevuto note condivise da altri utenti.</p>
      </div>

      <div *ngIf="!isLoading && sharedNotes.length > 0" class="notes-list">
        <mat-card *ngFor="let note of sharedNotes"
                  class="note-card"
                  (click)="openNote(note.id)">
          <mat-card-header>
            <mat-icon mat-card-avatar class="note-avatar">description</mat-icon>
            <mat-card-title>{{ note.title }}</mat-card-title>
            <mat-card-subtitle>
              <span class="shared-by">
                <mat-icon class="small-icon">person</mat-icon>
                Condivisa da <strong>{{ note.ownerUsername }}</strong>
              </span>
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <p class="note-preview">{{ getPreview(note.content) }}</p>
            <div class="note-meta">
              <span class="meta-item">
                <mat-icon class="small-icon">schedule</mat-icon>
                {{ formatDate(note.updatedAt || note.createdAt) }}
              </span>
              <span *ngIf="note.folderName" class="meta-item">
                <mat-icon class="small-icon">folder</mat-icon>
                {{ note.folderName }}
              </span>
            </div>
          </mat-card-content>

          <mat-card-actions align="end">
            <button mat-button color="primary" (click)="openNote(note.id); $event.stopPropagation()">
              <mat-icon>visibility</mat-icon>
              Visualizza
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      <div *ngIf="error" class="error-message">
        <mat-icon>error</mat-icon>
        <p>{{ error }}</p>
        <button mat-button color="primary" (click)="loadSharedNotes()">Riprova</button>
      </div>
    </div>
  `,
  styles: [`
    .shared-container {
      padding: 24px;
      max-width: 900px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 24px;

      h1 {
        margin: 0 0 8px 0;
        color: #333;
        font-size: 28px;
        font-weight: 500;
      }

      .subtitle {
        margin: 0;
        color: #666;
        font-size: 14px;
      }
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 20px;
      color: #666;

      p {
        margin-top: 16px;
      }
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #666;

      .empty-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #ccc;
        margin-bottom: 16px;
      }

      h2 {
        margin: 0 0 8px 0;
        font-weight: 400;
      }

      p {
        margin: 0;
        color: #999;
      }
    }

    .notes-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .note-card {
      cursor: pointer;
      transition: box-shadow 0.2s, transform 0.2s;

      &:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateY(-2px);
      }

      .note-avatar {
        background-color: #3f51b5;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        width: 40px;
        height: 40px;
      }
    }

    .shared-by {
      display: flex;
      align-items: center;
      gap: 4px;

      strong {
        color: #3f51b5;
      }
    }

    .note-preview {
      color: #666;
      font-size: 14px;
      line-height: 1.5;
      margin: 8px 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .note-meta {
      display: flex;
      gap: 16px;
      margin-top: 12px;

      .meta-item {
        display: flex;
        align-items: center;
        gap: 4px;
        color: #999;
        font-size: 12px;
      }
    }

    .small-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .error-message {
      text-align: center;
      padding: 40px 20px;
      color: #d32f2f;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 16px;
      }

      p {
        margin: 0 0 16px 0;
      }
    }
  `]
})
export class SharedNotesListComponent implements OnInit {
  sharedNotes: SharedNote[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSharedNotes();
  }

  loadSharedNotes(): void {
    this.isLoading = true;
    this.error = null;

    this.http.get<NoteListResponse>(`${environment.apiUrl}/permissions/shared-with-me`)
      .subscribe({
        next: (response) => {
          this.sharedNotes = response.notes || [];
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Errore caricamento note condivise:', err);
          this.error = 'Impossibile caricare le note condivise. Riprova.';
          this.isLoading = false;
        }
      });
  }

  openNote(noteId: number): void {
    this.router.navigate(['/shared', noteId]);
  }

  getPreview(content: string): string {
    if (!content) return 'Nessun contenuto';
    return content.length > 150 ? content.substring(0, 150) + '...' : content;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
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
}
