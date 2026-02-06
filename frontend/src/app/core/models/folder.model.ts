export interface Folder {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
  modifiedAt: Date;
  ownerId: number;
  ownerUsername: string;
  notesCount: number;
  isShared: boolean;
  canEdit: boolean;
  canDelete: boolean;
  parentId?: number;
  children?: Folder[];
  path?: string;
  level?: number;
}

export interface FolderRequest {
  name: string;
  description?: string;
  parentId?: number;
}

export interface FolderTree extends Folder {
  children: FolderTree[];
  isExpanded?: boolean;
  isSelected?: boolean;
}

export interface FolderStats {
  totalNotes: number;
  sharedNotes: number;
  collaborators: number;
  lastActivity: Date;
  size: number; // in bytes
}

export type PermissionType = 'read' | 'write' | 'admin';

export interface FolderPermission {
  id: number;
  folderId: number;
  userId: number;
  username: string;
  type: PermissionType;
  recursive: boolean; // applies to subfolders
  grantedAt: Date;
  grantedBy: string;
}