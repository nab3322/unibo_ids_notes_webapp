import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoteService } from '../../core/services/note.service';
import { PermissionService } from '../../core/services/permission.service';
import { Note } from '../../core/models/note.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { ShareDialogComponent } from '../../shared/components/share-dialog/share-dialog.component';

@Component({
  selector: 'app-notes-list',
  templateUrl: './notes-list.component.html',
  styles: [`
    .notes-container { padding: 20px; max-width: 1200px; margin: 0 auto; }
    .notes-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    .notes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
    .note-card { cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
    .note-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .note-preview {
      max-height: 80px;
      overflow: hidden;
      color: #666;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
    }
    .loading-shade { display: flex; justify-content: center; padding: 40px; }
    .empty-state { text-align: center; padding: 60px 20px; color: #666; }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; color: #ccc; margin-bottom: 16px; }
    .folder-badge { display: inline-flex; align-items: center; gap: 4px; margin-left: 8px; font-size: 12px; color: #1976d2; }
    .folder-badge mat-icon { font-size: 14px; width: 14px; height: 14px; }
    mat-card-actions { display: flex; align-items: center; }
    .spacer { flex: 1; }
    .shared-icon { color: #1976d2; font-size: 20px; }
    .folder-filter { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; padding: 12px; background: #e3f2fd; border-radius: 8px; }
    .folder-filter mat-icon { color: #1976d2; }
  `]
})
export class NotesListComponent implements OnInit {
  notes: Note[] = [];
  isLoading = true;
  currentFolderId: number | null = null;
  currentFolderName: string = '';

  constructor(
    private noteService: NoteService,
    private permissionService: PermissionService,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.currentFolderId = params['folderId'] ? Number(params['folderId']) : null;
      this.loadNotes();
    });
  }

  loadNotes(): void {
    this.isLoading = true;
    const filter = this.currentFolderId ? { folderId: this.currentFolderId } : {};
    this.noteService.getNotes(filter).subscribe({
      next: (response) => {
        this.notes = response.notes;
        if (this.currentFolderId && this.notes.length > 0 && this.notes[0].folderName) {
          this.currentFolderName = this.notes[0].folderName;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Errore caricamento note:', err);
        this.isLoading = false;
      }
    });
  }

  clearFolderFilter(): void {
    this.currentFolderId = null;
    this.currentFolderName = '';
    this.router.navigate(['/notes']);
  }

  deleteNote(note: Note): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Elimina nota',
        message: `Sei sicuro di voler eliminare "${note.title}"?`,
        confirmText: 'Elimina',
        cancelText: 'Annulla'
      },
      autoFocus: 'first-tabbable',
      restoreFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.noteService.deleteNote(note.id).subscribe({
          next: () => {
            this.snackBar.open('Nota eliminata', 'OK', { duration: 3000 });
            this.loadNotes();
          },
          error: (err) => {
            console.error('Errore eliminazione nota:', err);
            this.snackBar.open('Errore durante l\'eliminazione', 'Chiudi', { duration: 5000 });
          }
        });
      }
    });
  }

  shareNote(note: Note): void {
    const dialogRef = this.dialog.open(ShareDialogComponent, {
      width: '500px',
      data: {
        noteId: note.id,
        noteTitle: note.title
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Nota condivisa con successo!', 'OK', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.loadNotes();
      }
    });
  }

  copyNote(note: Note): void {
    this.noteService.copyNote(note.id).subscribe({
      next: (copiedNote) => {
        this.snackBar.open('Nota copiata con successo!', 'OK', { duration: 3000 });
        this.loadNotes();
      },
      error: (err) => {
        console.error('Errore durante la copia:', err);
        this.snackBar.open('Errore durante la copia della nota', 'Chiudi', { duration: 5000 });
      }
    });
  }

  leaveNote(note: Note): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Abbandona nota',
        message: `Sei sicuro di voler abbandonare "${note.title}"? Non avrai più accesso a questa nota.`,
        confirmText: 'Abbandona',
        cancelText: 'Annulla'
      },
      autoFocus: 'first-tabbable',
      restoreFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.permissionService.leaveNote(note.id).subscribe({
          next: () => {
            this.snackBar.open('Hai abbandonato la nota', 'OK', { duration: 3000 });
            this.loadNotes();
          },
          error: (err) => {
            console.error('Errore durante l\'abbandono:', err);
            this.snackBar.open('Errore durante l\'abbandono della nota', 'Chiudi', { duration: 5000 });
          }
        });
      }
    });
  }
}
