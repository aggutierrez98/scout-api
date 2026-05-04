// src/bin/applyMigrations.ts
import fs from "fs/promises";
import path from "path";
import { createClient } from "@libsql/client";
import { SecretsManager } from "../utils/classes/SecretsManager";

type MigrationColumns = {
	hasBytes: boolean;
	hasFinishedAt: boolean;
};

const ensurePrismaMigrationsTable = async (
	client: ReturnType<typeof createClient>,
): Promise<MigrationColumns> => {
	try {
		await client.execute("SELECT migration_name FROM _prisma_migrations LIMIT 1");
	} catch (e: any) {
		if (!e.message || !e.message.includes("no such table: _prisma_migrations")) {
			throw e;
		}

		// Esquema compatible con Prisma para SQLite.
		await client.execute(`
			CREATE TABLE "_prisma_migrations" (
				"id"                    TEXT PRIMARY KEY NOT NULL,
				"checksum"              TEXT NOT NULL,
				"finished_at"           DATETIME,
				"migration_name"        TEXT NOT NULL,
				"logs"                  TEXT,
				"rolled_back_at"        DATETIME,
				"started_at"            DATETIME NOT NULL DEFAULT current_timestamp,
				"applied_steps_count"   INTEGER UNSIGNED NOT NULL DEFAULT 0
			);
		`);
	}

	const tableInfo = await client.execute(`PRAGMA table_info("_prisma_migrations")`);
	const columnNames = new Set(
		tableInfo.rows.map((row: any) => (row.name ?? row[1]) as string),
	);

	return {
		hasBytes: columnNames.has("bytes"),
		hasFinishedAt: columnNames.has("finished_at"),
	};
};

async function main() {
	const secrets = SecretsManager.getInstance();
	await secrets.initialize(); // obtiene TURSO_DATABASE_URL y TURSO_AUTH_TOKEN de Infisical
	const { DATABASE_URL, AUTH_TOKEN } = secrets.getTursoSecrets();

	const client = createClient({ url: DATABASE_URL, authToken: AUTH_TOKEN });
	const migrationColumns = await ensurePrismaMigrationsTable(client);

	// obtener migraciones ya aplicadas consultando la tabla _prisma_migrations en la base remota
	const applied = await client.execute("SELECT migration_name FROM _prisma_migrations");
	const appliedNames = new Set(
		applied.rows.map((r: any) => (r.migration_name ?? r[0]) as string),
	);

	const migrationsDir = path.resolve("src/prisma/migrations");
	const dirs = (await fs.readdir(migrationsDir))
		.sort()
		.filter((d) => !d.startsWith("."));
	for (const dir of dirs) {
		if (
			!appliedNames.has(dir) &&
			(await fs.stat(path.join(migrationsDir, dir))).isDirectory()
		) {
			const file = await fs.readFile(
				path.join(migrationsDir, dir, "migration.sql"),
				"utf8",
			);
			// dividir por ';' y ejecutar todas las sentencias en un solo batch.
			// Usar batch() es crítico para migraciones que usan PRAGMA foreign_keys=OFF /
			// PRAGMA defer_foreign_keys=ON (patrón RedefineTables de Prisma): con execute()
			// individual cada llamada HTTP es una sesión nueva y el PRAGMA no persiste;
			// con batch("write") todas las sentencias comparten la misma transacción y
			// defer_foreign_keys=ON difiere los FK checks hasta el commit.
			const statements = file
				.split(/;\s*\n/)
				.map((s) => s.trim())
				.filter((s) => s.replace(/--[^\n]*/g, "").trim().length > 0);

			try {
				await client.batch(
					statements.map((sql) => ({ sql, args: [] })),
					"write",
				);
			} catch (e: any) {
				const msg: string = e?.message ?? "";
				if (msg.includes("already exists") || msg.includes("duplicate")) {
					console.warn(`⚠️  Skipped (already exists): primera sentencia de ${dir}`);
				} else {
					throw e;
				}
			}

			// Registrar DESPUÉS de ejecutar exitosamente — si falla arriba, no se registra
			if (migrationColumns.hasBytes) {
				await client.execute({
					sql: `INSERT INTO "_prisma_migrations" (id, checksum, bytes, applied_steps_count, migration_name) VALUES (?, ?, ?, ?, ?)`,
					args: [dir, "checksum", file.length, statements.length, dir],
				});
			} else if (migrationColumns.hasFinishedAt) {
				await client.execute({
					sql: `INSERT INTO "_prisma_migrations" (id, checksum, migration_name, started_at, finished_at, applied_steps_count) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)`,
					args: [dir, "checksum", dir, statements.length],
				});
			} else {
				await client.execute({
					sql: `INSERT INTO "_prisma_migrations" (id, checksum, migration_name, applied_steps_count) VALUES (?, ?, ?, ?)`,
					args: [dir, "checksum", dir, statements.length],
				});
			}

			console.log(`✅ Migración ${dir} aplicada`);
		}
	}
}

main().catch((err) => { console.error(err); process.exit(1); });
