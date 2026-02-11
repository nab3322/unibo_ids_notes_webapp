export interface ConflictResponse {
  hasConflict: boolean;
  conflictId?: string;
  conflictDetails?: string;
  currentContent?: string;
  incomingContent?: string;
  baseContent?: string;
  resolvedContent?: string;
  conflictType?: ConflictType;
  timestamp?: Date;
  involvedUsers?: string[];
}

export enum ConflictType {
  CONTENT = 'CONTENT',
  TITLE = 'TITLE',
  TAGS = 'TAGS',
  METADATA = 'METADATA',
  SIMULTANEOUS_EDIT = 'SIMULTANEOUS_EDIT'
}

export enum ResolutionStrategy {
  ACCEPT_CURRENT = 'ACCEPT_CURRENT',
  ACCEPT_INCOMING = 'ACCEPT_INCOMING',
  MANUAL_MERGE = 'MANUAL_MERGE',
  AUTO_MERGE = 'AUTO_MERGE',
  CREATE_BRANCH = 'CREATE_BRANCH'
}

export interface ConflictResolution {
  conflictId: string;
  strategy: ResolutionStrategy;
  resolvedContent?: string;
  resolutionNotes?: string;
  resolvedBy: string;
  resolvedAt: Date;
}

export interface ConflictMarker {
  type: 'start' | 'separator' | 'end';
  content: string;
  lineNumber: number;
  source: 'current' | 'incoming';
}

export interface TextDiff {
  type: 'added' | 'removed' | 'unchanged' | 'modified';
  content: string;
  lineNumber?: number;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface ConflictPreview {
  mergedContent: string;
  conflicts: ConflictMarker[];
  canAutoResolve: boolean;
  recommendedStrategy: ResolutionStrategy;
}