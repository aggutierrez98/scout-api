---
name: scout-api-business-domain
description: Business domain rules for scout-api. Use when adding payment logic, document workflows, webhook processing, scout progression, or RBAC permission changes.
triggers:
  - "pago"
  - "payment"
  - "comprobante"
  - "scout"
  - "documento"
  - "permiso"
  - "permission"
  - "rol"
  - "role"
  - "webhook"
  - "progresion"
  - "entrega"
  - "familiar"
---

# Scout API — Business Domain Rules

## Roles and Permissions

### Role Hierarchy (ascending)

```
EXTERNO < COLABORADOR < EDUCADOR < JEFE_RAMA < ADMINISTRADOR
```

Each role inherits all permissions from lower roles. Additional roles exist for organizational structure but do not grant system permissions: `JOVEN`, `ACOMPAÑANTE`, `AYUDANTE_RAMA`, `SUBJEFE_RAMA`, `SUBJEFE_GRUPO`, `JEFE_GRUPO`, `PADRE_REPRESENTANTE`.

### Permission Format

```
{accion}_{recurso}
```

Valid actions: `read`, `create`, `modify`, `delete`
Valid resources: `scout`, `familiar`, `equipo`, `documento`, `pago`, `entrega`, `auth`

### Permission Sets (from `src/utils/permissions.ts`)

Never add permissions directly to a role check — always use or extend the exported constants:

```typescript
EXTERNO_PERM     // read_* on all entities + create_documento
COLABORADOR_PERM // + create_pago, modify_pago, modify_documento
EDUCADOR_PERM    // + create/modify scout/equipo/familiar/entrega, delete equipo/documento/pago
JEFE_PERM        // + modify_scout, delete_scout/familiar/entrega
ADMIN_PERM       // + create_auth, modify_auth
```

When adding a new permission: add it to the LOWEST role that makes sense and let it propagate via spread.

## Scout Business Rules

- **DNI is unique** — validate uniqueness before create/update
- **rama must match equipo.rama** — a scout in `MANADA` cannot belong to a `TROPA` team
- **estado** never hard-deletes — use `ACTIVO` / `INACTIVO` / `EGRESADO`
- **telefono** is used for webhook matching — store in normalized local format (without country prefix)
- **uuid** is generated server-side (nanoid) — never accept it from the client

## Payment Business Rules

- **metodoPago** values: `EFECTIVO`, `TRANSFERENCIA`, `OTRO`
- **rendido** is derived automatically at creation: `TRANSFERENCIA` → `true` (already settled), `EFECTIVO` / `OTRO` → `false` (pending manual settlement by treasurer)
- **Payments created via webhook** always have `metodoPago = "TRANSFERENCIA"` — `rendido` is set by the same derivation rule (`true`)
- **concepto** max 50 chars, stored in UPPERCASE
- **fechaPago**: if missing from webhook payload, default to current date

## Webhook — Comprobante Processing Rules

The webhook endpoint `/api/webhook/comprobante` processes receipts from `whatsapp-comprobantes`. These are the ONLY automated payment creation rules:

### Auth
- Header `X-Webhook-Secret` must equal `HMAC-SHA256(rawBody, WEBHOOK_SECRET)`
- If missing or wrong → 401, no processing
- Header `X-Webhook-Source` must equal `"whatsapp-comprobantes"`

### Scout Matching (in priority order)

1. **By phone**: normalize both numbers (remove `549` / `54` / `0` prefixes) then compare
2. **By name**: case-insensitive, strip accents, compare against `nombre + " " + apellido`
3. **No match**: return `HTTP 422` with received data — DO NOT create the payment

### When `es_comprobante = false`

The OCR determined the image is NOT a payment receipt. Return `HTTP 422` without attempting any match.

## Document Business Rules

- `completable = true`: PDF is generated server-side from template + scout data
- `completable = false`: user uploads the PDF directly
- If document `vence = true`: store `fechaVencimiento` from the document
- Documents are uploaded to S3 at key: `documentos/scout_{uuid}/{documentoId}.pdf`
- If scout already has that document type → update, don't create duplicate
- Presigned download URLs expire after 1 hour

## Entrega (Badge/Achievement) Rules

- One `EntregaRealizada` per scout per badge type
- Progresión stages: Huella → Senda → Travesía
- Only EDUCADOR and above can create/modify entregas

## Familiar Relationship Rules

- A scout can have multiple familiares (N:M via `FamiliarScout`)
- Relation types: `PADRE`, `MADRE`, `TUTOR`, `OTRO`
- A familiar can be linked to multiple scouts (e.g., siblings)
- Some documents (`requiereFamiliar = true`) need familiar data to be generated

## Nómina — Cruz del Sur Integration Rules

Scout `estado` is driven by presence in the official Cruz del Sur roster:
- **DNI found in nómina** → `estado = "ACTIVO"`
- **DNI NOT in nómina** (scout was previously active) → `estado = "INACTIVO"`
- **Member in nómina not found in our system** → log only, DO NOT auto-create scouts

Three sync modes — all use `NominaService`:
1. `POST /api/nomina/sync` — on-demand pull, requires `create_nomina` (ADMINISTRADOR only)
2. `POST /api/webhook/nomina` — push from cruz-del-sur, auth via HMAC-SHA256 + `X-Webhook-Source: cruz-del-sur`
3. Cron job in `Server.ts` — daily at 10:00 UTC (7 AM Argentina)

Field mapping uses existing constants: `RAMAS_MAP` (rama), `FUNCIONES_MAP` (funcion) from `src/utils/constants.ts`.
Sexo normalization: "Masculino"/"masculino"/"m" → "M"; "Femenino"/"femenino"/"f" → "F".
Date parsing: handles both "DD/MM/YYYY" (cruz-del-sur format) and "YYYY-MM-DD".

Required env vars: `CRUZ_DEL_SUR_API_URL`, `CRUZ_DEL_SUR_API_KEY`, `NOMINA_WEBHOOK_SECRET`.

## Rama — Age Ranges (for reference, not enforced in API)

| Rama | Ages |
|------|------|
| MANADA | 6–10 |
| UNIDAD | 10–14 |
| CAMINANTES | 14–17 |
| PIONEROS | 17–21 |
