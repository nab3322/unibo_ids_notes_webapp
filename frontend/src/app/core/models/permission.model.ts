// Tipi di permessi base (compatibili con il PDF)
export enum PermissionType {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  SHARE = 'share',

  // Estensioni dal tuo codice
  PRIVATE = 'PRIVATE',
  READ_ONLY = 'READ_ONLY',
  READ_WRITE = 'READ_WRITE'
}

// Interfaccia base compatibile con Note e AuthService
export interface Permission {
  id: number;
  userId: number;
  noteId: number;
  permissionType: PermissionType;
  grantedAt: Date;
  isActive: boolean;

  // Campi extra dal tuo modello
  username?: string;
  grantedBy?: string;
  grantedById?: number;
  expiresAt?: Date;
}

// Richiesta di condivisione (dal tuo codice)
export interface ShareNoteRequest {
  username: string;
  permissionType: PermissionType;
  expiresAt?: Date;
  message?: string;
}

// Risposta alla condivisione
export interface ShareNoteResponse {
  success: boolean;
  message: string;
  permission?: Permission;
}

// Aggiornamento permesso
export interface PermissionUpdate {
  permissionId: number;
  type: PermissionType;
  expiresAt?: Date;
}

// Label user-friendly per i permessi (solo per quelli custom)
export const PERMISSION_LABELS = {
  [PermissionType.PRIVATE]: 'Solo io',
  [PermissionType.READ_ONLY]: 'Solo lettura',
  [PermissionType.READ_WRITE]: 'Lettura e scrittura',
  [PermissionType.READ]: 'Lettura',
  [PermissionType.WRITE]: 'Scrittura',
  [PermissionType.DELETE]: 'Eliminazione',
  [PermissionType.SHARE]: 'Condivisione'
};

export const PERMISSION_DESCRIPTIONS = {
  [PermissionType.PRIVATE]: 'Solo tu puoi vedere questa nota',
  [PermissionType.READ_ONLY]: 'Gli altri possono leggere ma non modificare',
  [PermissionType.READ_WRITE]: 'Gli altri possono leggere e modificare',
  [PermissionType.READ]: 'Permette di leggere la nota',
  [PermissionType.WRITE]: 'Permette di modificare la nota',
  [PermissionType.DELETE]: 'Permette di eliminare la nota',
  [PermissionType.SHARE]: 'Permette di condividere la nota con altri utenti'
};

export const PERMISSION_ICONS = {
  [PermissionType.PRIVATE]: 'lock',
  [PermissionType.READ_ONLY]: 'visibility',
  [PermissionType.READ_WRITE]: 'edit',
  [PermissionType.READ]: 'visibility',
  [PermissionType.WRITE]: 'edit',
  [PermissionType.DELETE]: 'delete',
  [PermissionType.SHARE]: 'share'
};
