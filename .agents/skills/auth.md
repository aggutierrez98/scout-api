---
name: scout-api-auth
description: Authentication and user management rules for scout-api. Use when working on login, firstLogin, user creation, JWT handling, checkSession middleware, or anything related to the User model.
triggers:
  - "auth"
  - "usuario"
  - "user"
  - "login"
  - "firstLogin"
  - "first login"
  - "contraseña"
  - "password"
  - "JWT"
  - "token"
  - "checkSession"
  - "invitationToken"
  - "activar cuenta"
---

# Scout API — Authentication & User Management

## User Model Fields

| Field | Type | Notes |
|---|---|---|
| `uuid` | String | API-facing ID — always rename to `id` via `mapUser` |
| `username` | String unique | 8–20 chars, letters only |
| `password` | String? | bcrypt hash — `null` until first login |
| `invitationToken` | String? | nanoid(20) — generated at creation when no password; single-use; cleared to `null` after first login |
| `role` | String | Default `"EXTERNO"` |
| `active` | Boolean | Default `true` |
| `scoutId` | String? unique | Linked scout |
| `familiarId` | String? unique | Linked familiar |

## JWT

- Expiry: **2 hours**
- Payload: `{ id: user.uuid }`
- Header: `Authorization: Bearer <token>`
- Secret: `SecretsManager.getInstance().getJWTSecret()` — never `process.env`

## Roles y Permission Sets

El sistema NO usa una jerarquía lineal simple. Cada rol mapea a un permission set fijo definido en `src/utils/permissions.ts`:

| Rol | Permission set | Notas |
|---|---|---|
| `EXTERNO` | `EXTERNO_PERM` | Solo lectura |
| `JOVEN` | `EXTERNO_PERM` | Igual que EXTERNO |
| `COLABORADOR` | `COLABORADOR_PERM` | + create/modify pago y documento |
| `ACOMPAÑANTE` | `COLABORADOR_PERM` | Igual que COLABORADOR |
| `PADRE_REPRESENTANTE` | `FAMILIAR_PERM` | Solo lectura + documentos propios; sin pagos |
| `AYUDANTE_RAMA` | `AYUDANTE_PERM` | + create entregas, equipos, familiares |
| `SUBJEFE_RAMA` | `EDUCADOR_PERM` | + create scout, delete doc/pago |
| `JEFE_RAMA` | `JEFE_PERM` | + modify/delete scout, familiar, create/modify/delete evento |
| `SUBJEFE_GRUPO` | `JEFE_PERM` | Igual que JEFE_RAMA |
| `JEFE_GRUPO` | `JEFE_PERM` | Igual que JEFE_RAMA |
| `ADMINISTRADOR` | `ADMIN_PERM` | + gestión de usuarios y tipo-evento |

El mapa `grants` vive en `src/utils/helpers/validatePermissions.ts`.

## Row-Level Scoping (ScopingContext)

Independiente del RBAC, cada request autenticado lleva un `ScopingContext` que limita las filas visibles:

```typescript
// src/utils/helpers/buildScopingContext.ts
export interface ScopingContext {
    scope: 'ALL' | 'RAMA' | 'FAMILIAR'
    rama?: RamasType | null
    familiarId?: string
}
```

| Scope | Roles que lo reciben | Efecto en queries |
|---|---|---|
| `ALL` | ADMINISTRADOR, JEFE_GRUPO, SUBJEFE_GRUPO, COLABORADOR, etc. | Sin filtro adicional |
| `RAMA` | `AYUDANTE_RAMA`, `SUBJEFE_RAMA`, `JEFE_RAMA` | `WHERE scout.rama = user.scout.rama` |
| `FAMILIAR` | `PADRE_REPRESENTANTE` | `WHERE scout.id IN (scouts vinculados al familiar)` |

El middleware `src/middlewares/session.ts` agrega `res.locals.scopingContext` después de autenticar. Los controllers lo pasan a los services como parámetro.

## checkSession Middleware

Runs on every protected route. Order in middleware chain:

```typescript
router.get("/:id",
  validate(GetXSchema),   // 1. Zod
  checkSession,           // 2. JWT + RBAC
  cacheMiddleware,        // 3. Cache (GET only)
  controller.getItem,     // 4. Handler
);
```

What `checkSession` does:
1. Extract token from `Authorization: Bearer …`
2. `verifyToken(token)` → decodes with `JWT_SECRET`, gets `userId`
3. Fetch user from DB (`password NOT NULL` — only activated users)
4. Validate RBAC permissions for the route
5. Attach user to `res.locals.currentUser`

**Exception**: `PUT /api/auth/firstLogin` does NOT use `checkSession` — it's the activation endpoint for users with no password.

## Account Activation Flow (First Login)

Users created from the web panel have `password: null`. Activation:

```
1. Admin: POST /api/auth/create
   → generates invitationToken = nanoid(20) if no password provided
   → returns { ...user, invitationToken } in the response

2. Admin shares invitationToken with user (WhatsApp, email, etc.)

3. User: PUT /api/auth/firstLogin (no auth required)
   Body: { username, invitationToken, password }
   → validates: user exists + password IS NULL + invitationToken matches
   → sets hashed password
   → clears invitationToken → null (token is invalidated, single-use)

4. User can now log in normally: POST /api/auth
```

### Service Implementation Pattern

```typescript
// getUser — finds unactivated user with matching token
const user = await authService.getUser({
  username,
  hasLoggedIn: false,      // filters: password IS NULL
  invitationToken,         // filters: invitationToken = ?
});
if (!user) throw new AppError({ name: "NOT_VALID_USER", httpCode: 401 });

// modifyUser — sets password and clears token
await authService.modifyUser({
  userId: user.id,
  password,                // hashed by modifyUser
  clearInvitationToken: true,  // sets invitationToken: null
});
```

## User Creation Rules

- `invitationToken` is generated ONLY when `password` is not provided at creation
- If `password` is provided at creation (e.g., admin user via `createUAdminUser`), no token is generated
- A user linked to a `scoutId` OR `familiarId` — never both
- `role` defaults to `"EXTERNO"` if not specified
- Response from `POST /api/auth/create` includes `invitationToken` so admin can share it

## Validators

```typescript
// validators/auth.ts
const passRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,12}$/

FirstLoginSchema: {
  body: { username: string, password: string (passRegex), invitationToken: string }
}

RegisterSchema: {
  body: { username: string (unique), password?: string (passRegex), role?, scoutId?, familiarId? }
}

ModifySchema: {
  body: { active?, role?, password? }
  params: { id: validUserID }
}
```

## Routes Summary

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth` | None | Login — returns JWT |
| `GET` | `/api/auth/renew` | Bearer | Renew JWT |
| `GET` | `/api/auth/me` | Bearer | Current user data |
| `GET` | `/api/auth/notifications` | Bearer | User notifications |
| `GET` | `/api/auth/users` | Bearer (ADMIN) | List users |
| `GET` | `/api/auth/users/:id` | Bearer (ADMIN) | Get user by UUID |
| `POST` | `/api/auth/create` | Bearer (ADMIN) | Create user — returns `invitationToken` if no password |
| `PUT` | `/api/auth/firstLogin` | None | Activate account with invitation token |
| `PUT` | `/api/auth/:id` | Bearer (ADMIN) | Modify user (role, active) |
