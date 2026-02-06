import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { FolderService } from '../../core/services/folder.service';
import { Folder } from '../../core/models/folder.model';
import { InputDialogComponent, InputDialogData } from '../../shared/components/input-dialog/input-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-folders',
  templateUrl: './folders.component.html',
  styleUrls: ['./folders.component.scss']
})
export class FoldersComponent implements OnInit {
  folders: any[] = [];
  isLoading = true;

  constructor(
    private folderService: FolderService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadFolders();
  }

  loadFolders(): void {
    this.isLoading = true;
    this.folderService.getRootFolders().subscribe({
      next: (data) => {
        this.folders = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Errore caricamento cartelle:', err);
        this.isLoading = false;
      }
    });
  }

  createFolder(): void {
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
          next: () => this.loadFolders(),
          error: (err) => console.error('Errore creazione cartella:', err)
        });
      }
    });
  }

  openFolder(folder: any): void {
    this.router.navigate(['/notes'], { queryParams: { folderId: folder.id } });
  }

  editFolder(folder: any): void {
    const dialogData: InputDialogData = {
      title: 'Rinomina Cartella',
      message: 'Inserisci il nuovo nome della cartella',
      inputLabel: 'Nome cartella',
      inputValue: folder.name,
      confirmText: 'Salva',
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
      if (result && result.trim() && result !== folder.name) {
        this.folderService.updateFolder(String(folder.id), result.trim()).subscribe({
          next: () => this.loadFolders(),
          error: (err) => console.error('Errore modifica cartella:', err)
        });
      }
    });
  }

  deleteFolder(folder: any): void {
    const dialogData: ConfirmDialogData = {
      title: 'Elimina Cartella',
      message: `Sei sicuro di voler eliminare la cartella "${folder.name}"? Questa azione non può essere annullata.`,
      confirmText: 'Elimina',
      cancelText: 'Annulla',
      type: 'danger'
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData,
      autoFocus: 'first-tabbable',
      restoreFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.folderService.deleteFolder(String(folder.id)).subscribe({
          next: () => this.loadFolders(),
          error: (err) => console.error('Errore eliminazione cartella:', err)
        });
      }
    });
  }
}
