---
name: scout-api-migrations
description: Workflow completo para crear y aplicar migraciones de base de datos en scout-api. Usar siempre que se agreguen modelos al schema de Prisma, se modifiquen tablas existentes, o se solucionen errores de "no such table". Este proyecto usa Turso/LibSQL como BD remota con un script custom de migraciones — NO usar `prisma migrate deploy`.
---

# Migraciones en scout-api

## Arquitectura del sistema de migraciones

Este proyecto usa **Prisma como generador de SQL** pero aplica las migraciones manualmente a **Turso (LibSQL)** via un script custom.

- Schema: `src/prisma/schema.prisma`
- Migraciones generadas: `src/prisma/migrations/` ← ÚNICA carpeta válida
- Script de aplicación: `src/bin/applyMigrations.ts`
- BD local (solo para Prisma CLI): SQLite en `data/scout.db`
- BD real (producción y dev): Turso vía `@libsql/client`

> ⚠️ La carpeta `prisma/migrations/` en la raíz del proyecto es **legacy**. Ignorarla. Las migraciones activas están en `src/prisma/migrations/`.

## Flujo correcto para agregar un nuevo modelo

### 1. Agregar el modelo al schema

Editar `src/prisma/schema.prisma`.

### 2. Generar el archivo SQL de migración

```bash
npm run prisma:migrate:dev
```

Este comando usa `--create-only` — **genera el SQL pero NO lo aplica** a la BD local SQLite.

> ⚠️ GOTCHA: Si la BD local SQLite está vacía o no sincronizada con Turso, Prisma puede generar una migración que recrea **todas** las tablas desde cero en lugar de solo el delta. Revisar siempre el archivo generado antes de aplicar.

### 3. Verificar el SQL generado

```bash
cat src/prisma/migrations/<timestamp>_<nombre>/migration.sql
```

El archivo debe contener **solo** los cambios nuevos (nuevas tablas, columnas, índices). Si contiene `CREATE TABLE "User"` u otras tablas ya existentes, hay que editar el archivo y dejar solo el delta.

### 4. Aplicar a Turso

```bash
npm run prisma:apply-migrations:dev
```

El script (`src/bin/applyMigrations.ts`):
1. Consulta `_prisma_migrations` en Turso para saber qué ya se aplicó
2. Ejecuta las sentencias SQL de cada migración pendiente
3. Registra la migración en `_prisma_migrations` **después** de ejecutar exitosamente

### 5. Regenerar el cliente de Prisma

```bash
npm run prisma:generate-client:dev
```

---

## Diagnóstico de errores frecuentes

### `no such table: main.Tabla`

La tabla existe en el schema pero no en Turso. Pasos:

1. Verificar qué tablas existen en Turso:
```bash
node_modules/.bin/dotenv -e .env.development -- node_modules/.bin/ts-node -e "
const { createClient } = require('@libsql/client');
const { SecretsManager } = require('./src/utils/classes/SecretsManager');
async function main() {
  const s = SecretsManager.getInstance();
  await s.initialize();
  const { DATABASE_URL, AUTH_TOKEN } = s.getTursoSecrets();
  const c = createClient({ url: DATABASE_URL, authToken: AUTH_TOKEN });
  const r = await c.execute(\"SELECT name FROM sqlite_master WHERE type='table' ORDER BY name\");
  console.log(r.rows.map((x: any) => x[0] || x.name));
}
main().catch(console.error);
"
```

2. Verificar qué migraciones están registradas:
```bash
node_modules/.bin/dotenv -e .env.development -- node_modules/.bin/ts-node -e "
const { createClient } = require('@libsql/client');
const { SecretsManager } = require('./src/utils/classes/SecretsManager');
async function main() {
  const s = SecretsManager.getInstance();
  await s.initialize();
  const { DATABASE_URL, AUTH_TOKEN } = s.getTursoSecrets();
  const c = createClient({ url: DATABASE_URL, authToken: AUTH_TOKEN });
  const r = await c.execute('SELECT migration_name FROM _prisma_migrations ORDER BY migration_name');
  console.log(r.rows.map((x: any) => x[0] || x.migration_name));
}
main().catch(console.error);
"
```

3. Si la migración está registrada pero la tabla no existe → el SQL no se ejecutó (bug del script antiguo que registraba antes de ejecutar). Crear la tabla manualmente con `IF NOT EXISTS` o eliminar el registro de `_prisma_migrations` y volver a aplicar.

4. Si la migración no está registrada → correr `npm run prisma:apply-migrations:dev`.

### `table "X" already exists` al aplicar migraciones

Prisma regeneró toda la base en la migración porque la BD local SQLite estaba vacía. Editar el archivo `migration.sql` de esa migración y dejar solo las tablas/columnas nuevas.

### Migración registrada en `_prisma_migrations` pero SQL no ejecutado

Ocurre cuando el script registra la migración antes de ejecutar el SQL y falla en el medio. El script actual ya tiene esto corregido (registra después de ejecutar). Para corregir manualmente:

```bash
# Eliminar el registro erróneo y volver a aplicar
node_modules/.bin/dotenv -e .env.development -- node_modules/.bin/ts-node -e "
...
await c.execute({ sql: 'DELETE FROM _prisma_migrations WHERE migration_name = ?', args: ['nombre_migracion'] });
"
npm run prisma:apply-migrations:dev
```

---

## Gotchas críticos

| Situación | Qué pasa | Qué hacer |
|-----------|----------|-----------|
| BD local SQLite vacía | Prisma genera migración con schema completo | Editar el SQL, dejar solo el delta |
| `--create-only` en el script | El SQL se genera pero NO se aplica localmente | Normal, es intencional. Siempre usar `applyMigrations.ts` para Turso |
| Migración vacía (`-- This is an empty migration`) | El script la registra como aplicada con 0 statements | No es error, pero si después la editás ya no se va a re-ejecutar |
| Dos carpetas de migraciones | `prisma/migrations/` (raíz) es legacy. `src/prisma/migrations/` es la activa | Ignorar la raíz, nunca agregar migraciones ahí |

---

## Scripts relevantes del package.json

```json
"prisma:migrate:dev": "dotenv -e .env.development -- prisma migrate dev --name auto-$(date +%s) --create-only",
"prisma:apply-migrations:dev": "dotenv -e .env.development -- ts-node src/bin/applyMigrations.ts",
"prisma:generate-client:dev": "dotenv -e .env.development -- prisma generate"
```
