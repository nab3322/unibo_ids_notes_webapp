import { Component, OnInit } from '@angular/core';
import { NoteService } from '../../core/services/note.service';
import { FolderService } from '../../core/services/folder.service';
import { forkJoin } from 'rxjs'; // Per fare le chiamate in parallelo

@Component({
  selector: 'app-dashboard',
  templateUrl: 'dashboard.component.html',
  styles: [`
    .dashboard-container {
      padding: 40px 20px;
      max-width: 800px;
      margin: 0 auto;
      text-align: center;
    }
    .dashboard-container h1 {
      margin-bottom: 40px;
      color: #333;
    }
    .stats-grid {
      display: flex;
      justify-content: center;
      gap: 24px;
      flex-wrap: wrap;
      margin-bottom: 40px;
    }
    .stat-card {
      min-width: 200px;
      flex: 1;
      max-width: 250px;
    }
    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
    }
    .stat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #3f51b5;
    }
    .stat-info h2 {
      margin: 0;
      font-size: 32px;
      color: #333;
    }
    .stat-info p {
      margin: 4px 0 0 0;
      color: #666;
      font-size: 14px;
    }
    .actions {
      margin-top: 24px;
    }
  `]
})
export class DashboardComponent implements OnInit {
  stats = {
    totalNotes: 0,
    sharedNotes: 0,
    folders: 0
  };

  isLoading = true;

  constructor(
    private noteService: NoteService,
    private folderService: FolderService
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats() {
    this.isLoading = true;
    forkJoin({
      noteStats: this.noteService.getStatistics(),
      folders: this.folderService.getRootFolders()
    }).subscribe({
      next: (data) => {
        this.stats.totalNotes = data.noteStats.total || (data.noteStats as any).totalNotes || 0;

        this.stats.sharedNotes = (data.noteStats as any).sharedWithMe || 0;

        this.stats.folders = data.folders.length;

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Errore caricamento dashboard:', err);
        this.isLoading = false;
      }
    });
  }
}
