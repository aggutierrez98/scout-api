// Script de uso único: elimina el registro de la migración que fue marcada como aplicada
// pero cuyo batch falló (rollback), dejando la DB sin los cambios reales.
import { createClient } from "@libsql/client";
import { SecretsManager } from "../utils/classes/SecretsManager";

const MIGRATION_TO_RESET = "20260506000000_add_missing_columns_primer_ciclo";

async function main() {
	const secrets = SecretsManager.getInstance();
	await secrets.initialize();
	const { DATABASE_URL, AUTH_TOKEN } = secrets.getTursoSecrets();

	const client = createClient({ url: DATABASE_URL, authToken: AUTH_TOKEN });

	const result = await client.execute({
		sql: `DELETE FROM "_prisma_migrations" WHERE migration_name = ?`,
		args: [MIGRATION_TO_RESET],
	});

	console.log(`✅ Registro eliminado (rows affected: ${result.rowsAffected})`);
}

main().catch((err) => { console.error(err); process.exit(1); });
