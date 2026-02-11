import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, map } from 'rxjs/operators';

export interface ConflictItem {
  id: string;
  field: string;
  localValue: any;
  remoteValue: any;
  resolved?: boolean;
  selectedValue?: 'local' | 'remote' | 'custom';
  customValue?: any;
  description?: string;
  timestamp: Date;
}

export interface ConflictResolution {
  conflictId: string;
  selectedValue: 'local' | 'remote' | 'custom';
  resolvedValue: any;
  timestamp: Date;
}

export interface SyncConflict {
  id: string;
  resourceType: 'note' | 'folder' | 'settings';
  resourceId: string;
  conflicts: ConflictItem[];
  status: 'pending' | 'resolved' | 'ignored';
  createdAt: Date;
  resolvedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ConflictService {
  private readonly API_URL = '/api/conflicts';

  private conflictsSubject = new BehaviorSubject<SyncConflict[]>([]);
  public conflicts$ = this.conflictsSubject.asObservable();

  private hasUnresolvedConflictsSubject = new BehaviorSubject<boolean>(false);
  public hasUnresolvedConflicts$ = this.hasUnresolvedConflictsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadConflicts();
  }

  /**
   * Get all conflicts
   */
  getConflicts(): Observable<SyncConflict[]> {
    return this.http.get<SyncConflict[]>(this.API_URL)
      .pipe(
        tap(conflicts => {
          this.updateConflicts(conflicts);
        })
      );
  }

  /**
   * Get conflict by ID
   */
  getConflict(id: string): Observable<SyncConflict> {
    return this.http.get<SyncConflict>(`${this.API_URL}/${id}`);
  }

  /**
   * Resolve conflicts
   */
  resolveConflicts(conflictId: string, resolutions: ConflictResolution[]): Observable<SyncConflict> {
    return this.http.post<SyncConflict>(`${this.API_URL}/${conflictId}/resolve`, {
      resolutions
    }).pipe(
      tap(resolvedConflict => {
        this.updateConflictInList(resolvedConflict);
      })
    );
  }

  /**
   * Ignore conflict (keep local version)
   */
  ignoreConflict(conflictId: string): Observable<SyncConflict> {
    return this.http.post<SyncConflict>(`${this.API_URL}/${conflictId}/ignore`, {})
      .pipe(
        tap(ignoredConflict => {
          this.updateConflictInList(ignoredConflict);
        })
      );
  }

  /**
   * Accept all remote changes
   */
  acceptAllRemote(conflictId: string): Observable<SyncConflict> {
    return this.http.post<SyncConflict>(`${this.API_URL}/${conflictId}/accept-remote`, {})
      .pipe(
        tap(resolvedConflict => {
          this.updateConflictInList(resolvedConflict);
        })
      );
  }

  /**
   * Accept all local changes
   */
  acceptAllLocal(conflictId: string): Observable<SyncConflict> {
    return this.http.post<SyncConflict>(`${this.API_URL}/${conflictId}/accept-local`, {})
      .pipe(
        tap(resolvedConflict => {
          this.updateConflictInList(resolvedConflict);
        })
      );
  }

  /**
   * Create a new conflict (usually called during sync)
   */
  createConflict(
    resourceType: 'note' | 'folder' | 'settings',
    resourceId: string,
    conflicts: Omit<ConflictItem, 'id' | 'timestamp'>[]
  ): Observable<SyncConflict> {
    const conflictData = {
      resourceType,
      resourceId,
      conflicts: conflicts.map(conflict => ({
        ...conflict,
        id: this.generateId(),
        timestamp: new Date()
      }))
    };

    return this.http.post<SyncConflict>(this.API_URL, conflictData)
      .pipe(
        tap(newConflict => {
          const currentConflicts = this.conflictsSubject.value;
          this.updateConflicts([...currentConflicts, newConflict]);
        })
      );
  }

  /**
   * Delete resolved conflicts
   */
  deleteResolvedConflicts(): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/resolved`)
      .pipe(
        tap(() => {
          const currentConflicts = this.conflictsSubject.value;
          const activeConflicts = currentConflicts.filter(c => c.status === 'pending');
          this.updateConflicts(activeConflicts);
        })
      );
  }

  /**
   * Get conflicts count by status
   */
  getConflictsCounts(): Observable<{
    pending: number;
    resolved: number;
    ignored: number;
    total: number;
  }> {
    return this.conflicts$.pipe(
      map(conflicts => {
        const pending = conflicts.filter(c => c.status === 'pending').length;
        const resolved = conflicts.filter(c => c.status === 'resolved').length;
        const ignored = conflicts.filter(c => c.status === 'ignored').length;
        
        return {
          pending,
          resolved,
          ignored,
          total: conflicts.length
        };
      })
    );
  }

  /**
   * Check if there are unresolved conflicts
   */
  hasUnresolvedConflicts(): boolean {
    return this.hasUnresolvedConflictsSubject.value;
  }

  /**
   * Get pending conflicts only
   */
  getPendingConflicts(): Observable<SyncConflict[]> {
    return this.conflicts$.pipe(
      map(conflicts => conflicts.filter(c => c.status === 'pending'))
    );
  }

  /**
   * Simulate conflict detection (for testing)
   */
  simulateConflict(resourceType: 'note' | 'folder', resourceId: string): Observable<SyncConflict> {
    const mockConflicts: Omit<ConflictItem, 'id' | 'timestamp'>[] = [
      {
        field: 'title',
        localValue: 'Nota locale',
        remoteValue: 'Nota remota',
        description: 'Il titolo è stato modificato in entrambe le versioni'
      },
      {
        field: 'content',
        localValue: 'Contenuto locale...',
        remoteValue: 'Contenuto remoto...',
        description: 'Il contenuto è diverso'
      }
    ];

    return this.createConflict(resourceType, resourceId, mockConflicts);
  }

  /**
   * Load conflicts from server
   */
  private loadConflicts(): void {
    this.getConflicts().subscribe();
  }

  /**
   * Update conflicts list and unresolved status
   */
  private updateConflicts(conflicts: SyncConflict[]): void {
    this.conflictsSubject.next(conflicts);
    const hasUnresolved = conflicts.some(c => c.status === 'pending');
    this.hasUnresolvedConflictsSubject.next(hasUnresolved);
  }

  /**
   * Update a single conflict in the list
   */
  private updateConflictInList(updatedConflict: SyncConflict): void {
    const currentConflicts = this.conflictsSubject.value;
    const index = currentConflicts.findIndex(c => c.id === updatedConflict.id);
    
    if (index !== -1) {
      const newConflicts = [...currentConflicts];
      newConflicts[index] = updatedConflict;
      this.updateConflicts(newConflicts);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}