---
name: secrets-manager
description: Rules and patterns for secret access in scout-api via Infisical and SecretsManager. Use when writing any code that needs credentials, API keys, tokens, or config values — backend services, middlewares, controllers, or initialization code.
triggers:
  - "secret"
  - "secrets"
  - "SecretsManager"
  - "infisical"
  - "process.env"
  - "API key"
  - "JWT"
  - "firebase"
  - "credentials"
  - "token"
  - "password"
---

# SecretsManager — Conventions

## Core Rule

**Never use `process.env` for sensitive values.** All secrets come from `SecretsManager.getInstance()`.

```typescript
// CORRECT
import { SecretsManager } from "../utils/classes/SecretsManager";
const jwtSecret = SecretsManager.getInstance().getJWTSecret();

// WRONG
const jwtSecret = process.env.JWT_SECRET;
```

## Bootstrap Exception

The only `process.env` reads allowed after initialization are variables needed **before** Infisical can be contacted:

| Variable | Why process.env is OK |
|---|---|
| `INFISICAL_SITE_URL` | Needed to construct the SDK client |
| `INFISICAL_PROJECT_ID` | Needed to call the API |
| `INFISICAL_ENV` | Needed to scope secret queries |
| `INFISICAL_SERVICE_TOKEN` | Needed to authenticate |
| `PORT` | Used before `initialize()` resolves |
| `NODE_ENV` | Infrastructure-level, not a secret |

Everything else — JWT, DB URLs, AWS, Firebase, Redis, API keys — comes from `SecretsManager`.

## Available Getters

```typescript
const sm = SecretsManager.getInstance();

sm.getSecrets()               // AppSecrets — full object
sm.getJWTSecret()             // string
sm.getPort()                  // number
sm.getDatabaseURL()           // string
sm.getRedisURI()              // string
sm.getServiceApiKey()         // string (service-to-service auth)
sm.getDatosGrupo()            // DatosGrupo { numero, nombre, distrito, zona }

sm.getAWSSecrets()            // { S3_ACCESS_KEY, S3_BUCKET_NAME, S3_REGION, S3_SECRET_ACCESS_KEY }
sm.getBetterStackSecrets()    // { AUTH_TOKEN, INGESTING_HOST }
sm.getFirebaseSecrets()       // { SERVICE_ACCOUNT_JSON }
sm.getGoogleAISecrets()       // { API_KEY }
sm.getGoogleDriveSecrets()    // { PRIVATE_KEY, SERVICE_ACCOUNT_EMAIL, SPREADSHEET_DATA_KEY }
sm.getTursoSecrets()          // { AUTH_TOKEN, DATABASE_URL }
```

## Initialization Guard

`SecretsManager` throws if you call getters before `initialize()`. In middlewares or services that might run early, use `isReady()`:

```typescript
const sm = SecretsManager.getInstance();
const apiKey = sm.isReady() ? sm.getServiceApiKey() : undefined;
if (!apiKey) throw new AppError({ ... });
```

In normal service code (called after server start), `isReady()` is not needed — `initialize()` runs before any request is served.

## Infisical Structure

Secrets are organized in Infisical with this folder layout:

```
/ (root)
├── DATABASE_URL
├── DATOS_GRUPO         ← JSON string, parsed automatically
├── JWT_SECRET
├── PORT
├── REDIS_CONNECTION_URI
├── SERVICE_API_KEY
└── GOOGLE_AI_API_KEY

/AWS/
├── S3_ACCESS_KEY
├── S3_BUCKET_NAME
├── S3_REGION
└── S3_SECRET_ACCESS_KEY

/BETTERSTACK/
├── AUTH_TOKEN
└── INGESTING_HOST

/FIREBASE/
└── SERVICE_ACCOUNT_JSON  ← JSON string of service account key

/GOOGLE_DRIVE/
├── PRIVATE_KEY
├── SERVICE_ACCOUNT_EMAIL
└── SPREADSHEET_DATA_KEY

/TURSO/
├── AUTH_TOKEN
└── DATABASE_URL
```

## Adding a New Secret

1. Add it in Infisical (root `/` or a folder like `/MYSERVICE/`)
2. Add the key to `SECRET_KEYS` in `src/types/secrets.ts`
3. Add the typed field to the appropriate interface in `src/types/secrets.ts`
4. Read it in `SecretsManager.initialize()` using `getSecret()` or `getFolderSecret()`
5. Add a getter method on `SecretsManager`
6. Remove it from `.env.example` — it must NOT appear there

## .env.example Policy

`.env.example` ONLY documents bootstrap variables (see table above). It must NOT contain:
- Passwords or tokens
- AWS / Firebase / Turso credentials
- JWT secret
- Any value managed by Infisical

If you see a sensitive variable in `.env.example`, remove it.
