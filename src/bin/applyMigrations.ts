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
    let appliedNames = new Set<string>();
    
    try {
        const applied = await client.execute("SELECT migration_name FROM _prisma_migrations");
        appliedNames = new Set(applied.rows.map((r: any) => (r.migration_name ?? r[0]) as string));
    } catch (e: any) {
        if (e.message && e.message.includes("no such table: _prisma_migrations")) {
            // La tabla no existe, la creamos
            await client.execute(`
                CREATE TABLE "_prisma_migrations" (
                    "id"                    TEXT PRIMARY KEY NOT NULL,
                    "checksum"              TEXT NOT NULL,
                    "bytes"                 INTEGER NOT NULL,
                    "applied_steps_count"   INTEGER NOT NULL DEFAULT 0,
                    "logs"                  TEXT,
                    "rolled_back_at"        DATETIME,
                    "started_at"            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "migration_name"        TEXT NOT NULL
                );
            `);
        } else {
            throw e;
        }
    }

    const migrationsDir = path.resolve("src/prisma/migrations");
    const dirs = (await fs.readdir(migrationsDir)).sort().filter(d => !d.startsWith('.'));
    for (const dir of dirs) {
        if (!appliedNames.has(dir) && (await fs.stat(path.join(migrationsDir, dir))).isDirectory()) {
            const file = await fs.readFile(path.join(migrationsDir, dir, "migration.sql"), "utf8");
            // dividir por ';' y ejecutar cada sentencia;
            const statements = file.split(/;\s*\n/).filter(s => s.trim().replace(/--[^\n]*/g, "").trim().length > 0);
            for (const sql of statements) {
                await client.execute(sql);
            }

            // Registrar DESPUÉS de ejecutar exitosamente — si falla arriba, no se registra
            await client.execute({
                sql: `INSERT INTO "_prisma_migrations" (id, checksum, bytes, applied_steps_count, migration_name) VALUES (?, ?, ?, ?, ?)`,
                args: [dir, 'checksum', file.length, statements.length, dir]
            });

            console.log(`✅ Migración ${dir} aplicada`);
        }
    }
}

main().catch((err) => { console.error(err); process.exit(1); });
