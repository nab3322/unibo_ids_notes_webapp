import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Folder } from '../models/folder.model';
// 👇 Importa l'environment
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FolderService {
  // 🟢 CORRETTO:
  // Usa la variabile globale (http://localhost:8080) + l'endpoint specifico (/folders).
  // Nota: Abbiamo rimosso '/api' per coerenza con la correzione dell'AuthService.
  private readonly apiUrl = `${environment.apiUrl}/folders`;

  constructor(private http: HttpClient) {}

  getRootFolders(): Observable<Folder[]> {
    return this.http.get<Folder[]>(this.apiUrl);
  }

  getFolder(id: string): Observable<Folder> {
    return this.http.get<Folder>(`${this.apiUrl}/${id}`);
  }

  getSubfolders(parentId: string): Observable<Folder[]> {
    return this.http.get<Folder[]>(`${this.apiUrl}/${parentId}/subfolders`);
  }

  createFolder(name: string, parentId?: string): Observable<Folder> {
    const payload = { name, parentId };
    return this.http.post<Folder>(this.apiUrl, payload);
  }

  updateFolder(id: string, name: string, description?: string): Observable<Folder> {
    return this.http.put<Folder>(`${this.apiUrl}/${id}`, { name, description });
  }

  deleteFolder(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
