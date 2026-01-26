// src/bin/applyMigrations.ts
import fs from "fs/promises";
import path from "path";
import { createClient } from "@libsql/client";
import { SecretsManager } from "../utils/classes/SecretsManager";

async function main() {
    const secrets = SecretsManager.getInstance();
    await secrets.initialize();                            // obtiene TURSO_DATABASE_URL y TURSO_AUTH_TOKEN de Infisical
    const { DATABASE_URL, AUTH_TOKEN } = secrets.getTursoSecrets();

    const client = createClient({ url: DATABASE_URL, authToken: AUTH_TOKEN });

    // obtener migraciones ya aplicadas consultando la tabla _prisma_migrations en la base remota
    const applied = await client.execute("SELECT migration_name FROM _prisma_migrations");
    const appliedNames = new Set(applied.rows.map((r: any) => r.migration_name));

    const migrationsDir = path.resolve("prisma/migrations");
    const dirs = (await fs.readdir(migrationsDir)).sort();
    for (const dir of dirs) {
        if (!appliedNames.has(dir)) {
            const file = await fs.readFile(path.join(migrationsDir, dir, "migration.sql"), "utf8");
            // dividir por ';' y ejecutar cada sentencia; executeBatch puede usarse si está disponible
            const statements = file.split(/;\s*\n/).filter(s => s.trim().length > 0);
            for (const sql of statements) {
                await client.execute(sql);
            }
            console.log(`✅ Migración ${dir} aplicada`);
        }
    }
}

main().catch((err) => { console.error(err); process.exit(1); });
