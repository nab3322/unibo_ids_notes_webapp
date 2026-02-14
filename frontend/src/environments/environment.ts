export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  wsUrl: 'ws://localhost:8080',
  appName: 'Notes Sharing App',
  version: '1.0.0-dev',

  // Funzionalità abilitate in sviluppo
  features: {
    realTimeEditing: true,
    conflictResolution: true,
    versionHistory: true,
    collaboration: true,
    advancedSearch: true,
    darkTheme: true,
    exportOptions: false, // Disabilitato in dev per semplicità
    offlineMode: false    // Disabilitato in dev
  },

  // Configurazione applicazione
  config: {
    maxNoteLength: 280,
    maxTitleLength: 100,
    autoSaveInterval: 2000, // 2 secondi per sviluppo rapido
    maxTagsPerNote: 10,
    maxNotesPerFolder: 1000,
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 ore in dev
    maxCollaboratorsPerNote: 50,
    defaultPageSize: 20
  },

  // Configurazione API
  api: {
    timeout: 30000, // 30 secondi per debug
    retryAttempts: 3,
    retryDelay: 1000,
    enableCaching: false // Disabilitato in dev per debug
  },

  // Configurazione UI
  ui: {
    theme: 'light',
    language: 'it',
    dateFormat: 'DD/MM/YYYY HH:mm',
    enableAnimations: true,
    showTooltips: true,
    debugInfo: true
  },

  // Modalità sviluppo
  debug: {
    enabled: true,
    logLevel: 'debug',
    showPerformanceMetrics: true,
    enableReduxDevTools: true,
    mockData: true,
    bypassAuth: false, // Cambia a true per saltare login in dev
    showApiCalls: true
  },

  // Servizi esterni (disabilitati in dev)
  services: {
    analytics: false,
    errorReporting: false,
    webPushNotifications: false
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
