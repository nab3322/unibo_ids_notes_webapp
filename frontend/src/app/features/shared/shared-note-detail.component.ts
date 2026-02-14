import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface NoteDetail {
  id: number;
  title: string;
  content: string;
  ownerUsername: string;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
  version: number;
  folderName?: string;
  folderId?: number;
  isShared: boolean;
  canEdit: boolean;
}

@Component({
  selector: 'app-shared-note-detail',
  template: `
    <div class="detail-container">
      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Caricamento nota...</p>
      </div>

      <div *ngIf="!isLoading && note" class="note-detail">
        <!-- Header -->
        <div class="detail-header">
          <button mat-icon-button (click)="goBack()" class="back-button">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="header-info">
            <h1>{{ note.title }}</h1>
            <div class="owner-info">
              <mat-icon>person</mat-icon>
              <span>Condivisa da <strong>{{ note.ownerUsername }}</strong></span>
            </div>
          </div>
        </div>

        <!-- Metadata Card -->
        <mat-card class="meta-card">
          <mat-card-content>
            <div class="meta-grid">
              <div class="meta-item">
                <mat-icon>event</mat-icon>
                <div>
                  <span class="label">Data creazione</span>
                  <span class="value">{{ formatDate(note.createdAt) }}</span>
                </div>
              </div>
              <div class="meta-item">
                <mat-icon>update</mat-icon>
                <div>
                  <span class="label">Ultima modifica</span>
                  <span class="value">{{ formatDate(note.updatedAt || note.createdAt) }}</span>
                </div>
              </div>
              <div *ngIf="note.folderName" class="meta-item">
                <mat-icon>folder</mat-icon>
                <div>
                  <span class="label">Cartella</span>
                  <span class="value">{{ note.folderName }}</span>
                </div>
              </div>
              <div class="meta-item">
                <mat-icon>history</mat-icon>
                <div>
                  <span class="label">Versione</span>
                  <span class="value">{{ note.version }}</span>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Content Card -->
        <mat-card class="content-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>description</mat-icon>
            <mat-card-title>Contenuto</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="note-content">{{ note.content }}</div>
          </mat-card-content>
          <mat-card-actions *ngIf="note.canEdit" align="end">
            <button mat-raised-button color="primary" (click)="editNote()">
              <mat-icon>edit</mat-icon>
              Modifica
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      <div *ngIf="!isLoading && error" class="error-container">
        <mat-icon>error</mat-icon>
        <h2>Nota non trovata</h2>
        <p>{{ error }}</p>
        <button mat-raised-button color="primary" (click)="goBack()">
          Torna indietro
        </button>
      </div>
    </div>
  `,
  styles: [`
    .detail-container {
      padding: 24px;
      max-width: 800px;
      margin: 0 auto;
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

    .detail-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 24px;

      .back-button {
        margin-top: 4px;
      }

      .header-info {
        flex: 1;

        h1 {
          margin: 0 0 8px 0;
          font-size: 28px;
          font-weight: 500;
          color: #333;
        }

        .owner-info {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #666;

          mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
          }

          strong {
            color: #3f51b5;
          }
        }
      }
    }

    .meta-card {
      margin-bottom: 24px;

      .meta-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 24px;
      }

      .meta-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;

        mat-icon {
          color: #3f51b5;
          margin-top: 2px;
        }

        .label {
          display: block;
          font-size: 12px;
          color: #999;
          margin-bottom: 2px;
        }

        .value {
          display: block;
          font-size: 14px;
          color: #333;
          font-weight: 500;
        }
      }
    }

    .content-card {
      mat-card-header {
        margin-bottom: 16px;

        mat-icon[mat-card-avatar] {
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

      .note-content {
        white-space: pre-wrap;
        word-break: break-word;
        line-height: 1.7;
        font-size: 16px;
        color: #444;
        padding: 16px;
        background-color: #fafafa;
        border-radius: 8px;
        min-height: 200px;
      }
    }

    .error-container {
      text-align: center;
      padding: 60px 20px;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #d32f2f;
        margin-bottom: 16px;
      }

      h2 {
        margin: 0 0 8px 0;
        font-weight: 400;
        color: #333;
      }

      p {
        margin: 0 0 24px 0;
        color: #666;
      }
    }
  `]
})
export class SharedNoteDetailComponent implements OnInit {
  note: NoteDetail | null = null;
  isLoading = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const noteId = this.route.snapshot.paramMap.get('id');
    if (noteId) {
      this.loadNote(noteId);
    }
  }

  loadNote(id: string): void {
    this.isLoading = true;
    this.error = null;

    this.http.get<NoteDetail>(`${environment.apiUrl}/notes/${id}`)
      .subscribe({
        next: (note) => {
          this.note = note;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Errore caricamento nota:', err);
          this.error = 'Impossibile caricare la nota. Potrebbe essere stata rimossa o non hai i permessi per visualizzarla.';
          this.isLoading = false;
        }
      });
  }

  formatDate(dateStr: string): string {
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

  goBack(): void {
    this.router.navigate(['/shared']);
  }

  editNote(): void {
    if (this.note) {
      this.router.navigate(['/notes', this.note.id, 'edit']);
    }
  }
}
