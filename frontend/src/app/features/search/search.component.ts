import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SearchService, SearchFilters } from '../../core/services/search.service';
import { FolderService } from '../../core/services/folder.service';
import { Folder } from '../../core/models/folder.model';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit, OnDestroy {
  searchForm: FormGroup;
  searchResults: any[] = [];
  isLoading = false;
  hasSearched = false;

  searchTime = 0;
  private searchStartTime = 0;

  recentSearches: string[] = [];
  folders: Folder[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private searchService: SearchService,
    private folderService: FolderService,
    private router: Router
  ) {
    this.searchForm = this.fb.group({
      query: [''],
      author: [''],
      folderId: [''],
      createdFrom: [null],
      createdTo: [null],
      modifiedFrom: [null],
      modifiedTo: [null],
      includeShared: [true]
    });
  }

  ngOnInit(): void {
    // Load folders for filter dropdown
    this.loadFolders();

    // 1. Ascolta i risultati dal servizio
    this.searchService.results$
      .pipe(takeUntil(this.destroy$))
      .subscribe(results => {
        this.searchResults = results;

        if (this.searchStartTime > 0) {
          this.searchTime = Date.now() - this.searchStartTime;
          this.searchStartTime = 0; // Reset
        }
      });

    // 2. Ascolta lo stato di caricamento
    this.searchService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });
  }

  loadFolders(): void {
    this.folderService.getRootFolders()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (folders) => {
          this.folders = folders;
        },
        error: (err) => {
          console.error('Errore caricamento cartelle:', err);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(): void {
    const formValue = this.searchForm.value;

    this.hasSearched = true;
    this.searchStartTime = Date.now();

    const filters: SearchFilters = {
      author: formValue.author || undefined,
      folderId: formValue.folderId || undefined,
      createdFrom: formValue.createdFrom ? this.formatDateStart(formValue.createdFrom) : undefined,
      createdTo: formValue.createdTo ? this.formatDateEnd(formValue.createdTo) : undefined,
      modifiedFrom: formValue.modifiedFrom ? this.formatDateStart(formValue.modifiedFrom) : undefined,
      modifiedTo: formValue.modifiedTo ? this.formatDateEnd(formValue.modifiedTo) : undefined,
      includeShared: formValue.includeShared
    };

    this.searchService.search(formValue.query || '', filters);
  }

  // Format date as start of day in local timezone (00:00:00)
  private formatDateStart(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00`;
  }

  // Format date as end of day in local timezone (23:59:59)
  private formatDateEnd(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T23:59:59`;
  }

  clearFilters(): void {
    this.searchForm.patchValue({
      query: '',
      author: '',
      folderId: '',
      createdFrom: null,
      createdTo: null,
      modifiedFrom: null,
      modifiedTo: null,
      includeShared: true
    });
    // Clear results when clearing filters
    this.searchResults = [];
    this.hasSearched = false;
    this.searchService.clearResults();
  }

  // Helper per evidenziare il testo
  highlightSearchTerm(text: string): string {
    const query = this.searchForm.get('query')?.value;
    if (!query || !text) return text;

    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
  }

  useRecentSearch(query: string): void {
    this.searchForm.patchValue({ query });
    this.onSearch();
  }

  openNote(note: any): void {
    this.router.navigate(['/notes', note.id, 'edit']);
  }

  editNote(note: any): void {
    this.router.navigate(['/notes', note.id, 'edit']);
  }
}
