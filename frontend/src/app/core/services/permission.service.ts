import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Permission, ShareNoteRequest } from '../models/permission.model';
import { Note } from '../models/note.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private readonly apiUrl = `${environment.apiUrl}/permissions`;

  constructor(private http: HttpClient) {}

  /**
   * Share a note with another user
   */
  shareNote(noteId: string | number, request: { username: string; permission: string }): Observable<Permission> {
    return this.http.post<Permission>(`${this.apiUrl}/notes/${noteId}/share`, request);
  }

  /**
   * Get all permissions for a note
   */
  getNotePermissions(noteId: string | number): Observable<Permission[]> {
    return this.http.get<Permission[]>(`${this.apiUrl}/notes/${noteId}`);
  }

  /**
   * Revoke permission from a user
   */
  revokePermission(noteId: string | number, targetUserId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/notes/${noteId}/users/${targetUserId}`);
  }

  /**
   * Update permission for a user
   */
  updatePermission(noteId: string | number, targetUserId: number, permission: string): Observable<Permission> {
    return this.http.put<Permission>(`${this.apiUrl}/notes/${noteId}/users/${targetUserId}`, { permission });
  }

  /**
   * Get notes shared with current user
   */
  getSharedNotes(): Observable<Note[]> {
    return this.http.get<Note[]>(`${this.apiUrl}/shared-with-me`);
  }

  /**
   * Leave a shared note (remove yourself from it)
   */
  leaveNote(noteId: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/notes/${noteId}/leave`);
  }
}
