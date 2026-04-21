---
name: scout-api-conventions
description: Code and API design conventions for scout-api. Use when writing validators, services, controllers, or any TypeScript code in this project.
triggers:
  - "validator"
  - "schema"
  - "zod"
  - "service"
  - "controller"
  - "mapper"
  - "type"
  - "interface"
  - "typescript"
---

# Scout API — Code & API Design Conventions

## TypeScript Conventions

- **Files**: camelCase (`scoutService.ts`, `pagoMapper.ts`)
- **Classes**: PascalCase (`ScoutService`, `CacheManager`)
- **Functions**: camelCase (`getScout`, `validatePermissions`)
- **Constants**: UPPER_SNAKE_CASE (`JWT_EXPIRY`, `DEFAULT_TTL`)
- **Interfaces**: PascalCase with `I` prefix (`IScout`, `IPago`)
- **Enums**: PascalCase name, UPPER_SNAKE_CASE values (`ROLES.ADMINISTRADOR`)

## Zod Validators

One file per entity in `src/validators/`. Each file exports a schema per operation:

```typescript
// src/validators/scout.ts
export const PostScoutSchema = z.object({
  body: z.object({
    nombre: z.string().min(2).max(50),
    apellido: z.string().min(2).max(50),
    fechaNacimiento: z.string().datetime(),
    dni: z.string().regex(/^\d{7,8}$/),
    sexo: z.enum(["MASCULINO", "FEMENINO"]),
    rama: z.enum(["MANADA", "UNIDAD", "CAMINANTES", "PIONEROS"]),
    equipoId: z.string().optional(),
  }),
});

export const GetScoutSchema = z.object({
  params: z.object({ id: z.string() }),
});
```

Naming convention: `{Method}{Entity}Schema` (e.g., `PostScoutSchema`, `PutPagoSchema`, `GetDocumentoSchema`).

Always validate `body`, `params`, and `query` as separate nested objects so the `validate` middleware can access them correctly.

## Services

- One class per entity, file in `src/services/{entity}.ts`
- Use `prismaClient` from `src/utils/lib/prisma-client.ts` — never import Prisma directly
- Always return data through the appropriate mapper
- Throw `AppError` for expected failures (not found, conflict, etc.)

```typescript
export class ScoutService {
  async getItem(uuid: string) {
    const scout = await prisma.scout.findUnique({
      where: { uuid },
      include: { equipo: true },
    });
    if (!scout) throw new AppError({ name: "NOT_FOUND", httpCode: HttpCode.NOT_FOUND });
    return mapScout(scout);
  }
}
```

## Controllers

Thin HTTP layer. Extract from `req`, call service, send response:

```typescript
export class ScoutController {
  constructor(private readonly services: { scoutService: ScoutService }) {}

  getItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.services.scoutService.getItem(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
```

Always use arrow functions for handlers (preserves `this`). Always forward to `next(error)`.

## Mappers

One file per entity in `src/mappers/`. Must convert `uuid` → `id` and never expose integer `id`:

```typescript
// src/mappers/scout.ts
export function mapScout(scout: PrismaScout): IScout {
  const { uuid, id: _id, fechaNacimiento, ...rest } = scout;
  return {
    ...rest,
    id: uuid,
    edad: getAge(fechaNacimiento),
    fechaNacimiento,
  };
}
```

Export all mappers from `src/mappers/index.ts`.

## HTTP Response Conventions

- **200 OK**: successful GET / PUT
- **201 Created**: successful POST (new resource created)
- **204 No Content**: successful DELETE
- **400 Bad Request**: Zod validation failure
- **401 Unauthorized**: missing or invalid JWT / webhook signature
- **403 Forbidden**: insufficient RBAC permissions
- **404 Not Found**: resource doesn't exist
- **422 Unprocessable Entity**: business logic failure (e.g., webhook scout not found)
- **500 Internal Server Error**: unexpected error

Never return 200 for a creation. Never return raw Prisma errors to the client.

## AppError Usage

```typescript
import { AppError, HttpCode } from "../utils/classes/AppError";

// Correct
throw new AppError({
  name: "SCOUT_NOT_FOUND",        // machine-readable name
  description: "Scout no encontrado", // human-readable message
  httpCode: HttpCode.NOT_FOUND,
});

// For non-operational errors (bugs, not user errors):
throw new AppError({
  name: "UNEXPECTED_ERROR",
  httpCode: HttpCode.INTERNAL_SERVER_ERROR,
  isOperational: false,
});
```

## Secrets — Never Hardcode

All secrets come from `SecretsManager.getInstance()`. Never use `process.env` for sensitive values (JWT, AWS, DB credentials):

```typescript
// CORRECT
const jwtSecret = SecretsManager.getInstance().getJWTSecret();

// WRONG
const jwtSecret = process.env.JWT_SECRET;
```

Exception: bootstrap variables (`PORT`, `NODE_ENV`, `INFISICAL_*`) are read directly from `process.env` since they are needed before Infisical initializes.

## Cache Key Convention

```
{resource}/{identifier}        → scout/abc123
{resource}?{query}             → pago?scoutId=abc&rendido=false
```

The `cleanCacheMiddleware` should clear all keys matching `{resource}/*` on any write operation.

## Logging

Use `Logger` class (Winston singleton), never `console.log`:

```typescript
import logger from "../utils/classes/Logger";

logger.info("Scout creado", { scoutId: uuid });
logger.error("Error inesperado", { error: err.message, stack: err.stack });
logger.warn("Scout sin equipo asignado", { scoutId: uuid });
```

## S3 File Storage

Key format for uploaded documents:
```
documentos/{scoutUuid}/{documentoNombre}_{uploadId}.{ext}
```

Upload pattern (via `uploadToS3` from `src/utils/lib/s3.util.ts`):
```typescript
const key = `documentos/${scoutId}/${docName}_${uploadId}.pdf`;
const uploadPath = await uploadToS3(pdfBuffer, key);
// Store uploadPath in DocumentoPresentado.fileUploadId
```

Download — presigned URL (expires 1 hour):
```typescript
const url = await getFileInS3(uploadPath); // returns presigned URL string
```

Never expose raw S3 keys or bucket names in API responses — always generate presigned URLs.

## PDF Generation (pdf-lib)

```typescript
import { PDFDocument } from "pdf-lib";

// Load template from S3, fill form fields, flatten, upload
const pdfBytes = await getFileInS3(templateUploadId); // fetch template
const pdfDoc = await PDFDocument.load(pdfBytes);
const form = pdfDoc.getForm();

form.getTextField("nombre").setText(scout.nombre);
form.getTextField("apellido").setText(scout.apellido);
// ... fill all fields

form.flatten(); // make non-editable
const filledBuffer = Buffer.from(await pdfDoc.save());
await uploadToS3(filledBuffer, destinationKey);
```

Use the `ReciboPago` class in `src/utils/classes/documentos/` as the reference pattern for document generation.

## Prisma Queries

- Always use `uuid` in `where` clauses — never the integer `id`
- Use `include` for related data needed in the response
- Use `select` when only a subset of fields is needed (reduces bandwidth)
- For bulk operations, prefer `createMany` over looping `create`
- Migrations go in `src/prisma/migrations/` — never edit them manually
