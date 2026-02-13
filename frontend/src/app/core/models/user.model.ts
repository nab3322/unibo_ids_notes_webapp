// =============================================================================
// USER INTERFACES - Versione Unificata
// =============================================================================

/**
 * Interfaccia base per l'utente - unifica entrambe le versioni
 */
export interface User {
  id: string; // Cambiato a string per maggiore flessibilità
  username: string;
  email: string;
  createdAt: Date;
  
  // Proprietà del nome - supporta entrambe le versioni
  name?: string; // Nome completo
  firstName?: string;
  lastName?: string;
  
  // Stato dell'utente
  isActive?: boolean;
  isOnline?: boolean;
  lastSeen?: Date;
  
  // ✅ Ruolo utente (aggiunto per hasAnyRole)
  role?: UserRole;
  
  // Informazioni aggiuntive
  avatar?: string;
}

/**
 * Profilo utente esteso con preferenze
 */
export interface UserProfile extends User {
  preferences?: UserPreferences;
  bio?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: Date;
  timezone?: string;
}

/**
 * Preferenze utente
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: NotificationPreferences;
  editor: EditorPreferences;
  privacy: PrivacyPreferences;
}

/**
 * Preferenze notifiche
 */
export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  mentions: boolean;
  collaborations: boolean;
  updates: boolean;
  marketing: boolean;
}

/**
 * Preferenze editor
 */
export interface EditorPreferences {
  fontSize: number;
  fontFamily: string;
  autoSave: boolean;
  autoSaveInterval: number; // in secondi
  theme: 'light' | 'dark' | 'auto';
  wordWrap: boolean;
  lineNumbers: boolean;
}

/**
 * Preferenze privacy
 */
export interface PrivacyPreferences {
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  allowDirectMessages: boolean;
  profileVisibility: 'public' | 'private' | 'friends';
}

// =============================================================================
// AUTHENTICATION INTERFACES
// =============================================================================

/**
 * Risposta dell'autenticazione
 */
export interface AuthResponse {
  token: string;
  refreshToken: string; // ✅ Rimosso optional per compatibilità
  username: string;
  userId: string; // Mantenuto coerente con User.id
  user: User; // ✅ Rimosso optional per compatibilità
  expiresAt?: Date;
  expiresIn?: number; // Secondi
}

/**
 * Richiesta di login
 */
export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
  deviceInfo?: DeviceInfo;
}

/**
 * Richiesta di registrazione
 */
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  acceptTerms?: boolean;
  newsletter?: boolean;
}

/**
 * Richiesta di aggiornamento utente
 */
export interface UserUpdateRequest {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  bio?: string;
  phone?: string;
  avatar?: string;
  preferences?: Partial<UserPreferences>;
}

/**
 * Richiesta di cambio password
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Informazioni dispositivo
 */
export interface DeviceInfo {
  userAgent?: string;
  platform?: string;
  deviceId?: string;
  appVersion?: string;
}

// =============================================================================
// API RESPONSE INTERFACES
// =============================================================================

/**
 * Risposta API generica
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: ValidationError[];
  timestamp?: Date;
}

/**
 * Errore di validazione
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Lista paginata di utenti
 */
export interface UserListResponse {
  users: User[];
  pagination: PaginationInfo;
  total: number;
}

/**
 * Informazioni paginazione
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// =============================================================================
// ENUMS E COSTANTI
// =============================================================================

/**
 * Ruoli utente
 */
export enum UserRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user',
  GUEST = 'guest'
}

/**
 * Stato utente
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
  DELETED = 'deleted'
}

/**
 * Tipi di autenticazione
 */
export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  GITHUB = 'github',
  MICROSOFT = 'microsoft'
}

// =============================================================================
// TYPE GUARDS E UTILITIES
// =============================================================================

/**
 * Verifica se un oggetto è un User valido
 */
export function isValidUser(user: any): user is User {
  return (
    user &&
    typeof user.id === 'string' &&
    typeof user.username === 'string' &&
    typeof user.email === 'string' &&
    user.createdAt instanceof Date
  );
}

/**
 * Verifica se un utente è online
 */
export function isUserOnline(user: User): boolean {
  return user.isOnline === true;
}

/**
 * Ottiene il nome completo dell'utente
 */
export function getUserDisplayName(user: User): string {
  if (user.name) {
    return user.name;
  }
  
  if (user.firstName || user.lastName) {
    return [user.firstName, user.lastName].filter(Boolean).join(' ');
  }
  
  return user.username;
}

/**
 * Ottiene le iniziali dell'utente per l'avatar
 */
export function getUserInitials(user: User): string {
  const displayName = getUserDisplayName(user);
  const words = displayName.split(' ');
  
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  
  return displayName.substring(0, 2).toUpperCase();
}

/**
 * Verifica se l'utente ha completato il profilo
 */
export function isProfileComplete(user: User): boolean {
  return !!(
    user.email &&
    user.username &&
    (user.name || (user.firstName && user.lastName))
  );
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

/**
 * Preferenze utente di default
 */
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: 'auto',
  language: 'it',
  notifications: {
    email: true,
    push: true,
    mentions: true,
    collaborations: true,
    updates: false,
    marketing: false
  },
  editor: {
    fontSize: 14,
    fontFamily: 'Monaco, Consolas, monospace',
    autoSave: true,
    autoSaveInterval: 30,
    theme: 'auto',
    wordWrap: true,
    lineNumbers: true
  },
  privacy: {
    showOnlineStatus: true,
    showLastSeen: true,
    allowDirectMessages: true,
    profileVisibility: 'public'
  }
};

/**
 * Utente vuoto per inizializzazione
 */
export const EMPTY_USER: Partial<User> = {
  id: '',
  username: '',
  email: '',
  name: '',
  firstName: '',
  lastName: '',
  isActive: false,
  isOnline: false
};