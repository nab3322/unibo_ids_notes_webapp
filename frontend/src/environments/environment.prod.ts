export const environment = {
  production: true,
  apiUrl: '/api',  // Relativo per funzionare con nginx proxy in Docker
  wsUrl: location.protocol === 'https:' ? 'wss://' + location.host : 'ws://' + location.host,
  appName: 'Notes Sharing App',
  version: '1.0.0',

  // Funzionalità abilitate in produzione
  features: {
    realTimeEditing: true,
    conflictResolution: true,
    versionHistory: true,
    collaboration: true,
    advancedSearch: true,
    darkTheme: true,
    exportOptions: true,
    offlineMode: true
  },

  // Configurazione applicazione (più conservativa)
  config: {
    maxNoteLength: 280,
    maxTitleLength: 100,
    autoSaveInterval: 3000, // 3 secondi in produzione
    maxTagsPerNote: 10,
    maxNotesPerFolder: 1000,
    sessionTimeout: 8 * 60 * 60 * 1000, // 8 ore in produzione
    maxCollaboratorsPerNote: 25, // Ridotto per performance
    defaultPageSize: 15 // Ridotto per performance
  },

  // Configurazione API (ottimizzata)
  api: {
    timeout: 15000, // 15 secondi
    retryAttempts: 2,
    retryDelay: 2000,
    enableCaching: true
  },

  // Configurazione UI
  ui: {
    theme: 'light',
    language: 'it',
    dateFormat: 'DD/MM/YYYY HH:mm',
    enableAnimations: true,
    showTooltips: true,
    debugInfo: false
  },

  // Modalità produzione (debug disabilitato)
  debug: {
    enabled: false,
    logLevel: 'error',
    showPerformanceMetrics: false,
    enableReduxDevTools: false,
    mockData: false,
    bypassAuth: false,
    showApiCalls: false
  },

  // Servizi esterni (configurare con i veri ID)
  services: {
    analytics: true, // Abilita Google Analytics se configurato
    errorReporting: true, // Abilita Sentry se configurato
    webPushNotifications: true
  }
};

/*
 * IMPORTANTE: In produzione assicurati di:
 * 1. Configurare correttamente gli URL API
 * 2. Configurare i servizi di analytics e error reporting
 * 3. Testare tutte le funzionalità in staging prima del deploy
 * 4. Verificare che HTTPS sia abilitato per WebSocket
 * 5. Controllare le CSP (Content Security Policy) headers
 */
