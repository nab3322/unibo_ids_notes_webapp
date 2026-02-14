# Notes WebApp - Applicazione Web per la Gestione di Note Collaborative

**Progetto di Ingegneria del Software**  
Anno Accademico 2024/2025  
Università di Bologna

## Indice

- [Descrizione](#descrizione)
- [Team](#team)
- [Tecnologie](#tecnologie)
- [Prerequisiti](#prerequisiti)
- [Installazione](#installazione)
- [Avvio Applicazione](#avvio-applicazione)
- [Testing](#testing)
- [Struttura Progetto](#struttura-progetto)
- [Documentazione](#documentazione)

---

## Descrizione

Notes WebApp è un'applicazione web full-stack per la creazione, gestione e condivisione di note testuali. L'applicazione supporta l'organizzazione delle note tramite cartelle gerarchiche, il versionamento automatico, la collaborazione multi-utente e la gestione dei conflitti in caso di modifica concorrente.

### Funzionalità Principali

**Gestione Utenti**
- Registrazione e autenticazione utenti
- Gestione profilo utente
- Sistema di autenticazione basato su JWT

**Gestione Note**
- Creazione, modifica, eliminazione note (max 280 caratteri)
- Organizzazione in cartelle gerarchiche
- Versionamento automatico delle modifiche
- Copia di note esistenti
- Ricerca full-text nel titolo e contenuto

**Collaborazione**
- Condivisione note con permessi granulari (lettura/scrittura)
- Gestione permessi e collaboratori
- Rilevamento e risoluzione conflitti in caso di modifiche concorrenti

**Ricerca e Organizzazione**
- Ricerca avanzata con filtri
- Struttura a cartelle annidate
- Statistiche per cartella

---

## Team

**Composizione del Gruppo**

- Nabil Bouziane - Product Owner, Scrum Master, Developer
- Mattia Veroni - Scrum Master, Developer Lead
- Simone - Product Owner, Developer
- Cristina - Scrum Master, Developer Lead

**Nota**: I ruoli sono stati ruotati tra gli sprint seguendo la metodologia Scrum.

---

## Tecnologie

### Backend
- **Java 17**
- **Quarkus 3.6.4** - Framework supersonic subatomic Java
- **Hibernate ORM with Panache** - Persistenza dati
- **SmallRye JWT** - Autenticazione e autorizzazione
- **PostgreSQL 15** - Database relazionale
- **H2 Database** - Database in-memory per testing
- **JUnit 5** - Testing framework
- **RestAssured** - API testing
- **Maven** - Build automation

### Frontend
- **Angular 20.3.16**
- **TypeScript**
- **Angular Material** - Libreria componenti UI
- **RxJS** - Programmazione reattiva
- **Jasmine & Karma** - Testing
- **npm** - Package manager

### DevOps e Tools
- **Docker & Docker Compose** - Containerizzazione
- **GitHub Actions** - CI/CD pipeline
- **Git** - Version control
- **Swagger/OpenAPI** - Documentazione API

---

## Prerequisiti

- Java 17 o superiore
- Node.js 20 o superiore
- npm 10 o superiore
- Docker Desktop (per esecuzione con container)
- Git

### Verifica Installazioni

```bash
java -version    # Deve mostrare versione 17+
node -version    # Deve mostrare versione 20+
npm -version     # Deve mostrare versione 10+
docker -version  # Deve mostrare versione 20+
```

---

## Installazione

### 1. Clonare il Repository

```bash
git clone https://github.com/nab3322/unibo_ids_notes_webapp.git
cd unibo_ids_notes_webapp
```

### 2. Generare le Chiavi JWT

Le chiavi JWT sono necessarie per l'autenticazione. Devono essere generate prima del primo avvio.

**Su Linux/macOS:**

```bash
cd backend/src/main/resources
openssl genrsa -out privateKey.pem 2048
openssl rsa -pubout -in privateKey.pem -out publicKey.pem
cd ../../../..
```

**Su Windows (PowerShell):**

```powershell
cd backend\src\main\resources

# Genera chiave privata
$rsa = [System.Security.Cryptography.RSA]::Create(2048)
$privateKey = $rsa.ExportRSAPrivateKey()
$privatePem = "-----BEGIN PRIVATE KEY-----`n" + [Convert]::ToBase64String($privateKey, 'InsertLineBreaks') + "`n-----END PRIVATE KEY-----"
$privatePem | Out-File -FilePath "privateKey.pem" -Encoding ASCII

# Genera chiave pubblica
$publicKey = $rsa.ExportSubjectPublicKeyInfo()
$publicPem = "-----BEGIN PUBLIC KEY-----`n" + [Convert]::ToBase64String($publicKey, 'InsertLineBreaks') + "`n-----END PUBLIC KEY-----"
$publicPem | Out-File -FilePath "publicKey.pem" -Encoding ASCII

cd ..\..\..\..
```

---

## Avvio Applicazione

### Opzione 1: Docker Compose (Consigliata)

Questa è la modalità più semplice per avviare l'intera applicazione.

```bash
docker-compose up --build
```

L'applicazione sarà disponibile su:
- Frontend: http://localhost:4200
- Backend API: http://localhost:8080
- Swagger UI: http://localhost:8080/q/swagger-ui

Per arrestare l'applicazione:

```bash
docker-compose down
```

### Opzione 2: Avvio Manuale

#### Backend

```bash
cd backend

# Avvio in modalità development
./mvnw quarkus:dev
```

Il backend sarà disponibile su http://localhost:8080

#### Frontend

```bash
cd frontend

# Installazione dipendenze (solo la prima volta)
npm install

# Avvio development server
npm start
```

Il frontend sarà disponibile su http://localhost:4200

---

## Testing

### Test Backend

```bash
cd backend

# Esegui tutti i test
./mvnw test

# Esegui test con report coverage
./mvnw clean test jacoco:report
```

**Suite di Test Backend:**
- AuthControllerTest - 9 test
- NoteControllerTest - 8 test
- FolderServiceTest - 10 test
- NoteServiceTest - 12 test
- PermissionServiceTest - 12 test
- UserServiceTest - 8 test

**Totale: 59 test - Coverage: 73.2%**

### Test Frontend

```bash
cd frontend

# Esegui test
npm test

# Esegui test con coverage
npm run test:coverage
```

---

## Struttura Progetto

```
unibo_ids_notes_webapp/
│
├── backend/                    # Backend Quarkus
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/unibo/notes/
│   │   │   │   ├── controller/      # REST Controllers
│   │   │   │   ├── service/         # Business Logic
│   │   │   │   ├── entity/          # JPA Entities
│   │   │   │   ├── repository/      # Data Access Layer
│   │   │   │   ├── dto/             # Data Transfer Objects
│   │   │   │   └── util/            # Utility Classes
│   │   │   └── resources/
│   │   │       ├── application.properties
│   │   │       ├── privateKey.pem
│   │   │       └── publicKey.pem
│   │   └── test/                    # Test Suite
│   ├── pom.xml
│   └── Dockerfile
│
├── frontend/                   # Frontend Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/
│   │   │   ├── features/
│   │   │   └── shared/
│   │   ├── assets/
│   │   └── environments/
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml
├── .github/workflows/          # CI/CD Pipeline
└── docs/                       # Documentazione
```

---

## Documentazione

La documentazione completa del progetto include:

- **Manuale Utente** - Guida all'utilizzo dell'applicazione
- **Manuale Sviluppatore** - Architettura e design pattern utilizzati
- **Diario di Progetto** - Cronologia degli sprint e attività
- **Modello dei Casi d'Uso** - Descrizione funzionalità
- **Modello di Dominio** - Struttura dati e relazioni
- **Burn Down Chart** - Avanzamento progetto

Tutta la documentazione è disponibile nella cartella `docs/` in formato PDF.

### API Documentation

La documentazione interattiva delle API è disponibile tramite Swagger UI quando il backend è in esecuzione:

**http://localhost:8080/q/swagger-ui**

---

## Note di Sicurezza

- Le chiavi JWT (privateKey.pem e publicKey.pem) sono escluse dal repository tramite .gitignore
- Le password sono hashate utilizzando BCrypt
- L'autenticazione è gestita tramite JWT con meccanismo di refresh token
- La configurazione CORS è abilitata solo per origini fidate

---

## Licenza

Progetto sviluppato per scopi didattici nell'ambito del corso di Ingegneria del Software presso l'Università di Bologna.

Copyright © 2024 - Tutti i diritti riservati.

---

## Contatti

Per domande o chiarimenti sul progetto:

- Repository: https://github.com/nab3322/unibo_ids_notes_webapp
- Email: [inserire email del gruppo]

---

**Università di Bologna - Ingegneria del Software**  
**Anno Accademico 2024/2025**
