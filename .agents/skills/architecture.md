---
name: scout-api-architecture
description: Enforces architectural constraints for scout-api. Use before adding new features, routes, services, or touching the middleware pipeline.
triggers:
  - "new route"
  - "new endpoint"
  - "new service"
  - "new controller"
  - "middleware"
  - "nueva ruta"
  - "nuevo servicio"
  - "nuevo controlador"
---

# Scout API — Architecture Rules

You are working on **scout-api**, a Node.js/TypeScript REST API for managing a Scout group.

## Stack

- Runtime: Node.js v22.13.1+, TypeScript 5.9
- Framework: Express.js 4.21.2
- ORM: Prisma 7 with Turso (LibSQL)
- Cache: Redis
- Validation: Zod
- Secrets: Infisical (SecretsManager singleton)

## Layer Responsibilities

```
Routes      → define endpoints, apply middlewares
Controllers → HTTP only: extract from req, call service, format response
Services    → ALL business logic; access Prisma, call other services
Mappers     → entity → DTO transformation (ALWAYS uuid → id)
Validators  → Zod schemas, one file per entity in src/validators/
Middlewares → cross-cutting concerns only
```

### CRITICAL: Never cross layer boundaries

- Controllers NEVER access Prisma directly — only via services
- Services NEVER build HTTP responses — return plain objects/DTOs
- Routes NEVER contain business logic
- Validators NEVER import services or controllers

## ID Convention (NON-NEGOTIABLE)

- Every model has TWO id fields: `id` (autoincrement, internal only) and `uuid` (nanoid, API-facing)
- The API ALWAYS uses `uuid` externally — rename via mapper to `id`
- NEVER expose the raw Prisma `id` (integer) in any API response
- Every service result MUST pass through the corresponding mapper before being returned

```typescript
// CORRECT
const scout = await prisma.scout.findUnique({ where: { uuid } });
return mapScout(scout);

// WRONG — never return raw Prisma entity
return scout;
```

## Middleware Pipeline Order

Every protected route must follow this order:

```typescript
router.get(
  "/:id",
  validate(GetXSchema),   // 1. Zod validation
  checkSession,           // 2. JWT + RBAC
  cacheMiddleware,        // 3. Redis cache (GET only)
  controller.getItem,     // 4. Handler
);

router.put(
  "/:id",
  validate(PutXSchema),   // 1. Zod validation
  checkSession,           // 2. JWT + RBAC
  cleanCacheMiddleware,   // 3. Invalidate cache (writes)
  controller.updateItem,  // 4. Handler
);
```

## Webhook Routes — Special Case

Routes under `/api/webhook/*` are the ONLY exception to `checkSession`:

```typescript
// Webhook routes use webhookAuth (HMAC-SHA256), NOT checkSession
router.use("/webhook", createWebhookRouter(webhookService));
// Inside webhook router:
router.post("/comprobante", webhookAuth, validate(schema), controller.handler);
```

Never apply `checkSession` to webhook routes. Never apply `webhookAuth` to non-webhook routes.

## Dependency Injection Pattern

Services are instantiated in `Server.ts` and injected into routers:

```typescript
// Server.ts — ALWAYS here, not inside route files
const scoutService = new ScoutService();
router.use("/scout", checkSession, createScoutRouter(scoutService));
```

Never instantiate services inside controllers or validators.

## Error Handling

Always use `AppError` — never throw raw `Error`:

```typescript
import { AppError, HttpCode } from "../utils/classes/AppError";

throw new AppError({
  name: "SCOUT_NOT_FOUND",
  description: "Scout no encontrado",
  httpCode: HttpCode.NOT_FOUND,
});
```

The global `errorMiddleware` in `Server.ts` catches all `AppError` instances.

## Cache Strategy

- GET operations: use `cacheMiddleware` (cache-aside, TTL 60s)
- POST/PUT/DELETE: use `cleanCacheMiddleware` to invalidate related keys
- Cache key format: `{resource}/{params}` (e.g., `scout/123`, `pago?scoutId=abc`)
- Never cache webhook responses

## Data Model — Key Relationships

```
Scout ──1:N──> DocumentoPresentado
  │──1:N──> Pago
  │──1:N──> EntregaRealizada
  │──N:1──> Equipo
  │──N:M──> Familiar  (via FamiliarScout: familiarId, scoutId, relacion)
  └──1:1──> User?     (optional, via scoutId on User)

Documento ──1:N──> DocumentoPresentado
Familiar  ──1:1──> User?  (optional, via familiarId on User)
User      ──1:N──> Notificacion
User      ──1:N──> PushToken
Aviso     ──1:N──> Notificacion
```

- Every entity has `id` (autoincrement, internal) and `uuid` (nanoid, API-facing)
- Soft-delete only on Scout via `estado: ACTIVO | INACTIVO | EGRESADO` — no hard deletes on Scout

## Adding a New Resource — Checklist

When adding a new entity/resource, create ALL of these:

1. `src/types/{entity}.ts` — TypeScript interfaces
2. `src/validators/{entity}.ts` — Zod schemas for each operation
3. `src/services/{entity}.ts` — business logic class
4. `src/controllers/{entity}.ts` — HTTP handlers
5. `src/routes/{entity}.ts` — router factory function
6. `src/mappers/{entity}.ts` — entity → DTO mapper
7. Register in `Server.ts` `loadRoutes()` method

Never skip the mapper. Never skip Zod validation.
