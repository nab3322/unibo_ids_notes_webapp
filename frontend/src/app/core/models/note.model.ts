import { User } from './user.model';
import { Permission } from './permission.model';

// ---- Modello base ----
export interface Note {
  id: number | string;
  title: string;
  content: string;
  createdAt: Date;
  modifiedAt: Date;
  versionNumber: number;
  ownerUsername: string;
  ownerId: number | string;
  folderId?: number | string;
  folderName?: string;
  tags: string[];
  permissions?: Permission[];
  isShared: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isCollaborating?: boolean;
  collaborators?: User[];
  lastEditBy?: string;

  // Campi opzionali per compatibilità
  isArchived?: boolean;
  isFavorite?: boolean;
}

// ---- Interfaccia per le Risposte API (AGGIUNTA) ----
export interface NoteResponse {
  notes: Note[];
  total: number;
  page?: number;
  limit?: number;
}

// ---- Creazione / modifica ----
export interface NoteRequest {
  title: string;
  content: string;
  folderId?: number | string;
  tags?: string[];
  lastModified?: Date;
  isArchived?: boolean;
  isFavorite?: boolean;
}

// ---- Statistiche ----
export interface NoteStats {
  total: number;
  totalCharacters: number;
  wordCount: number;
  readingTime: number;
  collaborators: number;
  versions: number;
  shares: number;
}

// ---- Filtri ----
export interface NoteFilter {
  search?: string;
  tags?: string[];
  author?: string;
  dateFrom?: Date;
  dateTo?: Date;
  folderId?: number | string;
  isShared?: boolean;
  hasCollaborators?: boolean;
  isArchived?: boolean;
  isFavorite?: boolean;
}

// ---- Versioning & Diff ----
export interface NoteVersion {
  id: number;
  noteId: number;
  title: string;
  content: string;
  versionNumber: number;
  createdAt: Date;
  modifiedAt: Date;
  createdBy: string;
  createdById: number;
  modifiedBy?: number;
  modifiedByUsername?: string;
  changes?: string[];
  isCurrent?: boolean;
}

export interface NoteDiff {
  additions: string[];
  deletions: string[];
  modifications: string[];
}

export interface NoteSortOptions {
  field: 'title' | 'createdAt' | 'modifiedAt' | 'owner' | 'collaborators';
  direction: 'asc' | 'desc';
}
