import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap, catchError } from 'rxjs/operators';
// 👇 Importiamo l'environment
import { environment } from '../../../environments/environment';

export interface SearchResult {
  id: string;
  type: 'note' | 'folder' | 'tag';
  title: string;
  excerpt?: string;
  matches: SearchMatch[];
  relevanceScore: number;
  lastModified: Date;
}

export interface SearchMatch {
  field: string;
  value: string;
  highlights: { start: number; end: number }[];
}

export interface SearchFilters {
  types?: ('note' | 'folder')[];
  author?: string;
  dateFrom?: Date;
  dateTo?: Date;
  createdFrom?: string;
  createdTo?: string;
  modifiedFrom?: string;
  modifiedTo?: string;
  folderId?: string;
  hasAttachments?: boolean;
  includeShared?: boolean;
  includeArchived?: boolean;
}

export interface SearchOptions {
  fuzzy?: boolean;
  caseSensitive?: boolean;
  wholeWords?: boolean;
  includeArchived?: boolean;
  sortBy?: 'relevance' | 'date' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  took: number; // Time taken in milliseconds
  suggestions?: string[];
}

export interface SearchHistory {
  query: string;
  timestamp: Date;
  resultsCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  // 🟢 CORRETTO:
  // Usa environment.apiUrl + /search
  // Usa i BACKTICK (`...`) per interpolare la stringa
  private readonly API_URL = `${environment.apiUrl}/search`;

  private readonly HISTORY_KEY = 'search_history';
  private readonly MAX_HISTORY_ITEMS = 20;
  private readonly DEBOUNCE_TIME = 300;

  private searchSubject = new Subject<string>();
  private resultsSubject = new BehaviorSubject<SearchResult[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private historySubject = new BehaviorSubject<SearchHistory[]>([]);

  public results$ = this.resultsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public history$ = this.historySubject.asObservable();

  private currentQuery = '';
  private currentFilters: SearchFilters = {};
  private currentOptions: SearchOptions = {};

  constructor(private http: HttpClient) {
    this.initializeSearch();
    this.loadSearchHistory();
  }

  /**
   * Initialize search with debounce
   */
  private initializeSearch(): void {
    this.searchSubject.pipe(
      debounceTime(this.DEBOUNCE_TIME),
      distinctUntilChanged(),
      switchMap(query => {
        // Allow search with filters even if query is empty
        const hasFilters = this.hasActiveFilters();
        if (query.trim().length === 0 && !hasFilters) {
          this.resultsSubject.next([]);
          return of({ results: [], total: 0, took: 0 });
        }

        this.loadingSubject.next(true);
        return this.performSearch(query, this.currentFilters, this.currentOptions);
      })
    ).subscribe(response => {
      this.resultsSubject.next(response.results);
      this.loadingSubject.next(false);

      if (this.currentQuery.trim()) {
        this.addToHistory(this.currentQuery, response.total);
      }
    });
  }

  /**
   * Check if there are active filters
   */
  private hasActiveFilters(): boolean {
    const f = this.currentFilters;
    return !!(f.author || f.folderId || f.createdFrom || f.createdTo ||
              f.modifiedFrom || f.modifiedTo || f.dateFrom || f.dateTo ||
              (f.types && f.types.length > 0));
  }

  /**
   * Perform search with query
   */
  search(
    query: string,
    filters: SearchFilters = {},
    options: SearchOptions = {}
  ): void {
    this.currentQuery = query;
    this.currentFilters = filters;
    this.currentOptions = options;

    // For filter-based searches, call performSearch directly to avoid distinctUntilChanged blocking
    const hasFilters = !!(filters.author || filters.folderId || filters.createdFrom ||
                          filters.createdTo || filters.modifiedFrom || filters.modifiedTo);

    if (hasFilters || query.trim().length > 0) {
      this.loadingSubject.next(true);
      this.performSearch(query, filters, options).subscribe(response => {
        this.resultsSubject.next(response.results);
        this.loadingSubject.next(false);
        if (query.trim()) {
          this.addToHistory(query, response.total);
        }
      });
    } else {
      this.resultsSubject.next([]);
    }
  }

  /**
   * Immediate search (without debounce)
   */
  searchImmediate(
    query: string,
    filters: SearchFilters = {},
    options: SearchOptions = {}
  ): Observable<SearchResponse> {
    if (!query.trim()) {
      return of({ results: [], total: 0, took: 0 });
    }

    this.loadingSubject.next(true);
    return this.performSearch(query, filters, options)
      .pipe(
        tap(response => {
          this.resultsSubject.next(response.results);
          this.loadingSubject.next(false);
          this.addToHistory(query, response.total);
        })
      );
  }

  /**
   * Perform the actual search HTTP request
   */
  private performSearch(
    query: string,
    filters: SearchFilters,
    options: SearchOptions
  ): Observable<SearchResponse> {
    let params = new HttpParams().set('q', query);

    // Add filters
    if (filters.types && filters.types.length > 0) {
      params = params.set('types', filters.types.join(','));
    }
    if (filters.author) {
      params = params.set('author', filters.author);
    }
    if (filters.folderId) {
      params = params.set('folderId', filters.folderId);
    }
    if (filters.dateFrom) {
      params = params.set('dateFrom', filters.dateFrom.toISOString());
    }
    if (filters.dateTo) {
      params = params.set('dateTo', filters.dateTo.toISOString());
    }
    if (filters.createdFrom) {
      params = params.set('createdFrom', filters.createdFrom);
    }
    if (filters.createdTo) {
      params = params.set('createdTo', filters.createdTo);
    }
    if (filters.modifiedFrom) {
      params = params.set('modifiedFrom', filters.modifiedFrom);
    }
    if (filters.modifiedTo) {
      params = params.set('modifiedTo', filters.modifiedTo);
    }
    if (filters.hasAttachments !== undefined) {
      params = params.set('hasAttachments', filters.hasAttachments.toString());
    }
    if (filters.includeShared !== undefined) {
      params = params.set('includeShared', filters.includeShared.toString());
    }
    if (filters.includeArchived !== undefined) {
      params = params.set('includeArchived', filters.includeArchived.toString());
    }

    // Add options
    if (options.fuzzy !== undefined) {
      params = params.set('fuzzy', options.fuzzy.toString());
    }
    if (options.caseSensitive !== undefined) {
      params = params.set('caseSensitive', options.caseSensitive.toString());
    }
    if (options.wholeWords !== undefined) {
      params = params.set('wholeWords', options.wholeWords.toString());
    }
    if (options.includeArchived !== undefined) {
      params = params.set('includeArchived', options.includeArchived.toString());
    }
    if (options.sortBy) {
      params = params.set('sortBy', options.sortBy);
    }
    if (options.sortOrder) {
      params = params.set('sortOrder', options.sortOrder);
    }

    return this.http.get<SearchResponse>(this.API_URL, { params })
      .pipe(
        catchError(error => {
          console.error('Search error:', error);
          this.loadingSubject.next(false);
          return of({ results: [], total: 0, took: 0 });
        })
      );
  }

  /**
   * Get search suggestions
   */
  getSuggestions(query: string): Observable<string[]> {
    if (!query.trim()) {
      return of([]);
    }

    const params = new HttpParams().set('q', query);
    return this.http.get<string[]>(`${this.API_URL}/suggestions`, { params })
      .pipe(
        catchError(() => of([]))
      );
  }

  /**
   * Clear search results
   */
  clearResults(): void {
    this.currentQuery = '';
    this.resultsSubject.next([]);
  }

  /**
   * Get current search query
   */
  getCurrentQuery(): string {
    return this.currentQuery;
  }

  /**
   * Get search history
   */
  getSearchHistory(): SearchHistory[] {
    return this.historySubject.value;
  }

  /**
   * Add query to search history
   */
  private addToHistory(query: string, resultsCount: number): void {
    const currentHistory = this.historySubject.value;

    // Remove existing entry if it exists
    const filteredHistory = currentHistory.filter(h => h.query !== query);

    // Add new entry at the beginning
    const newHistory: SearchHistory[] = [
      { query, timestamp: new Date(), resultsCount },
      ...filteredHistory
    ].slice(0, this.MAX_HISTORY_ITEMS);

    this.historySubject.next(newHistory);
    this.saveSearchHistory(newHistory);
  }

  /**
   * Clear search history
   */
  clearHistory(): void {
    this.historySubject.next([]);
    localStorage.removeItem(this.HISTORY_KEY);
  }

  /**
   * Remove item from history
   */
  removeFromHistory(query: string): void {
    const currentHistory = this.historySubject.value;
    const filteredHistory = currentHistory.filter(h => h.query !== query);
    this.historySubject.next(filteredHistory);
    this.saveSearchHistory(filteredHistory);
  }

  /**
   * Search from history
   */
  searchFromHistory(historyItem: SearchHistory): void {
    this.search(historyItem.query, this.currentFilters, this.currentOptions);
  }

  /**
   * Save search history to localStorage
   */
  private saveSearchHistory(history: SearchHistory[]): void {
    try {
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.warn('Could not save search history:', error);
    }
  }

  /**
   * Load search history from localStorage
   */
  private loadSearchHistory(): void {
    try {
      const saved = localStorage.getItem(this.HISTORY_KEY);
      if (saved) {
        const history = JSON.parse(saved).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        this.historySubject.next(history);
      }
    } catch (error) {
      console.warn('Could not load search history:', error);
    }
  }

  /**
   * Export search results
   */
  exportResults(format: 'csv' | 'json' = 'json'): Observable<Blob> {
    const params = new HttpParams()
      .set('q', this.currentQuery)
      .set('format', format);

    return this.http.get(`${this.API_URL}/export`, {
      params,
      responseType: 'blob'
    });
  }
}
