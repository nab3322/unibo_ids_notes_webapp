import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, switchMap, finalize } from 'rxjs/operators';
import { Note, NoteRequest, NoteFilter, NoteResponse, NoteStats, NoteVersion } from '../models/note.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NoteService {
  // 🟢 CORRETTO:
  // 1. Usa environment.apiUrl (che ora è http://localhost:8080)
  // 2. Aggiunge /notes
  // 3. Usa i BACKTICK (`...`) non gli apici singoli ('...')
  // Risultato finale: http://localhost:8080/notes
  private readonly apiUrl = `${environment.apiUrl}/notes`;

  private notesSubject = new BehaviorSubject<Note[]>([]);
  public notes$ = this.notesSubject.asObservable();

  private currentNoteSubject = new BehaviorSubject<Note | null>(null);
  public currentNote$ = this.currentNoteSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get all notes with filtering and pagination
   */
  getNotes(filter: NoteFilter = {}, page: number = 1, limit: number = 20): Observable<NoteResponse> {
    this.loadingSubject.next(true);

    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filter.search) {
      params = params.set('search', filter.search);
    }
    if (filter.tags && filter.tags.length > 0) {
      params = params.set('tags', filter.tags.join(','));
    }
    if (filter.folderId) {
      params = params.set('folderId', filter.folderId.toString());
    }
    if (filter.isShared !== undefined) {
      params = params.set('isShared', filter.isShared.toString());
    }
    if (filter.dateFrom) {
      params = params.set('dateFrom', new Date(filter.dateFrom).toISOString());
    }
    if (filter.dateTo) {
      params = params.set('dateTo', new Date(filter.dateTo).toISOString());
    }

    return this.http.get<NoteResponse>(this.apiUrl, { params })
      .pipe(
        tap(response => {
          this.notesSubject.next(response.notes || []);
          this.loadingSubject.next(false);
        }),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  /**
   * Get note by ID
   */
  getNote(id: string | number): Observable<Note> {
    return this.http.get<Note>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(note => {
          this.currentNoteSubject.next(note);
        })
      );
  }

  /**
   * Create new note
   */
  createNote(noteData: NoteRequest): Observable<Note> {
    return this.http.post<Note>(this.apiUrl, noteData)
      .pipe(
        tap(newNote => {
          const currentNotes = this.notesSubject.value;
          this.notesSubject.next([newNote, ...currentNotes]);
        })
      );
  }

  /**
   * Update existing note
   */
  updateNote(id: string | number, updates: NoteRequest | Partial<Note>): Observable<Note> {
    return this.http.put<Note>(`${this.apiUrl}/${id}`, updates)
      .pipe(
        tap(updatedNote => {
          const currentNotes = this.notesSubject.value;
          const index = currentNotes.findIndex(note => String(note.id) === String(id));

          if (index !== -1) {
            const newNotes = [...currentNotes];
            newNotes[index] = updatedNote;
            this.notesSubject.next(newNotes);
          }

          if (String(this.currentNoteSubject.value?.id) === String(id)) {
            this.currentNoteSubject.next(updatedNote);
          }
        })
      );
  }

  /**
   * Delete note
   */
  deleteNote(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(() => {
          const currentNotes = this.notesSubject.value;
          const filteredNotes = currentNotes.filter(note => String(note.id) !== String(id));
          this.notesSubject.next(filteredNotes);

          if (String(this.currentNoteSubject.value?.id) === String(id)) {
            this.currentNoteSubject.next(null);
          }
        })
      );
  }

  /**
   * Duplicate note
   */
  duplicateNote(id: string | number): Observable<Note> {
    return this.getNote(id).pipe(
      switchMap(note =>
        this.createNote({
          title: `${note.title} (Copia)`,
          content: note.content,
          tags: [...note.tags],
          folderId: note.folderId
        })
      )
    );
  }

  /**
   * Add tags to note
   */
  addTags(noteId: string | number, newTags: string[]): Observable<Note> {
    return this.getNote(noteId).pipe(
      switchMap(note => {
        const uniqueTags = [...new Set([...note.tags, ...newTags])];
        const updateData: any = { tags: uniqueTags, title: note.title, content: note.content };
        return this.updateNote(noteId, updateData);
      })
    );
  }

  /**
   * Remove tags from note
   */
  removeTags(noteId: string | number, tagsToRemove: string[]): Observable<Note> {
    return this.getNote(noteId).pipe(
      switchMap(note => {
        const filteredTags = note.tags.filter(tag => !tagsToRemove.includes(tag));
        const updateData: any = { tags: filteredTags, title: note.title, content: note.content };
        return this.updateNote(noteId, updateData);
      })
    );
  }

  /**
   * Get all unique tags
   * Nota: Questo chiamerà http://localhost:8080/notes/tags
   */
  getAllTags(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/tags`);
  }

  /**
   * Search notes
   */
  searchNotes(query: string): Observable<Note[]> {
    if (!query.trim()) {
      return of([]);
    }
    return this.getNotes({ search: query }).pipe(
      map(res => res.notes)
    );
  }

  /**
   * Get statistics
   * Nota: Questo chiamerà http://localhost:8080/notes/statistics
   */
  getStatistics(): Observable<NoteStats> {
    return this.http.get<NoteStats>(`${this.apiUrl}/statistics`);
  }

  clearCurrentNote(): void {
    this.currentNoteSubject.next(null);
  }

  /**
   * Get note versions
   */
  getVersions(noteId: string | number): Observable<NoteVersion[]> {
    return this.http.get<NoteVersion[]>(`${this.apiUrl}/${noteId}/versions`);
  }

  /**
   * Get specific version
   */
  getVersion(noteId: string | number, versionNumber: number): Observable<NoteVersion> {
    return this.http.get<NoteVersion>(`${this.apiUrl}/${noteId}/versions/${versionNumber}`);
  }

  /**
   * Restore note to specific version
   */
  restoreVersion(noteId: string | number, versionNumber: number): Observable<Note> {
    return this.http.post<Note>(`${this.apiUrl}/${noteId}/versions/${versionNumber}/restore`, {});
  }

  /**
   * Copy note (creates a new note with same content)
   */
  copyNote(noteId: string | number): Observable<Note> {
    return this.http.post<Note>(`${this.apiUrl}/${noteId}/copy`, {})
      .pipe(
        tap(newNote => {
          const currentNotes = this.notesSubject.value;
          this.notesSubject.next([newNote, ...currentNotes]);
        })
      );
  }
}
