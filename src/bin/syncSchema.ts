import { createClient } from "@libsql/client";
import { SecretsManager } from "../utils/classes/SecretsManager";

// Columnas esperadas por tabla según el schema de Prisma.
// Solo se listan columnas que pueden estar ausentes en DBs creadas desde schemas anteriores.
// El script las agrega si faltan, ignorando si ya existen.
const EXPECTED_COLUMNS: Record<string, { name: string; sql: string }[]> = {
  Scout: [
    { name: "codigoPostal",     sql: "ALTER TABLE Scout ADD COLUMN codigoPostal TEXT" },
    { name: "afiliado",         sql: "ALTER TABLE Scout ADD COLUMN afiliado INTEGER NOT NULL DEFAULT 1" },
  ],
  Familiar: [
    { name: "codigoPostal",     sql: "ALTER TABLE Familiar ADD COLUMN codigoPostal TEXT" },
    { name: "estadoCivil",      sql: "ALTER TABLE Familiar ADD COLUMN estadoCivil TEXT" },
  ],
  User: [
    { name: "invitationToken",  sql: "ALTER TABLE User ADD COLUMN invitationToken TEXT" },
  ],
  Documento: [
    { name: "requiereFamiliar", sql: "ALTER TABLE Documento ADD COLUMN requiereFamiliar INTEGER NOT NULL DEFAULT 0" },
    { name: "requiereFirma",    sql: "ALTER TABLE Documento ADD COLUMN requiereFirma INTEGER NOT NULL DEFAULT 0" },
    { name: "requeridoIngreso", sql: "ALTER TABLE Documento ADD COLUMN requeridoIngreso INTEGER NOT NULL DEFAULT 0" },
  ],
  DocumentoPresentado: [
    { name: "scoutId",          sql: "ALTER TABLE DocumentoPresentado ADD COLUMN scoutId TEXT" },
    { name: "familiarId",       sql: "ALTER TABLE DocumentoPresentado ADD COLUMN familiarId TEXT" },
    { name: "uploadId",         sql: "ALTER TABLE DocumentoPresentado ADD COLUMN uploadId TEXT" },
    { name: "fechaPresentacion",sql: "ALTER TABLE DocumentoPresentado ADD COLUMN fechaPresentacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP" },
  ],
  Pago: [
    { name: "rendido",          sql: "ALTER TABLE Pago ADD COLUMN rendido INTEGER NOT NULL DEFAULT 0" },
  ],
  PagoRevision: [
    { name: "resueltoPorId",    sql: "ALTER TABLE PagoRevision ADD COLUMN resueltoPorId TEXT" },
    { name: "fechaResolucion",  sql: "ALTER TABLE PagoRevision ADD COLUMN fechaResolucion DATETIME" },
  ],
  CicloReglasPago: [
    { name: "cbusAceptados",    sql: "ALTER TABLE CicloReglasPago ADD COLUMN cbusAceptados TEXT NOT NULL DEFAULT '[]'" },
  ],
  ObligacionPago: [
    { name: "montoCondonado",   sql: "ALTER TABLE ObligacionPago ADD COLUMN montoCondonado REAL NOT NULL DEFAULT 0" },
    { name: "detalleCalculo",   sql: "ALTER TABLE ObligacionPago ADD COLUMN detalleCalculo TEXT" },
  ],
  Evento: [
    { name: "lugarNombre",                  sql: "ALTER TABLE Evento ADD COLUMN lugarNombre TEXT" },
    { name: "lugarLatitud",                 sql: "ALTER TABLE Evento ADD COLUMN lugarLatitud REAL" },
    { name: "lugarLongitud",                sql: "ALTER TABLE Evento ADD COLUMN lugarLongitud REAL" },
    { name: "centroSaludCercanoNombre",     sql: "ALTER TABLE Evento ADD COLUMN centroSaludCercanoNombre TEXT" },
    { name: "centroSaludCercanoDireccion",  sql: "ALTER TABLE Evento ADD COLUMN centroSaludCercanoDireccion TEXT" },
    { name: "centroSaludCercanaLocalidad",  sql: "ALTER TABLE Evento ADD COLUMN centroSaludCercanaLocalidad TEXT" },
    { name: "comisariaCercanaNombre",       sql: "ALTER TABLE Evento ADD COLUMN comisariaCercanaNombre TEXT" },
    { name: "comisariaCercanaDireccion",    sql: "ALTER TABLE Evento ADD COLUMN comisariaCercanaDireccion TEXT" },
    { name: "comisariaCercanaLocalidad",    sql: "ALTER TABLE Evento ADD COLUMN comisariaCercanaLocalidad TEXT" },
    { name: "costo",                        sql: "ALTER TABLE Evento ADD COLUMN costo REAL" },
  ],
  ReciboPago: [
    { name: "uploadPath",       sql: "ALTER TABLE ReciboPago ADD COLUMN uploadPath TEXT" },
  ],
  SaldoAFavor: [
    { name: "origen",           sql: "ALTER TABLE SaldoAFavor ADD COLUMN origen TEXT" },
  ],
  Aviso: [
    { name: "referenciaId",     sql: "ALTER TABLE Aviso ADD COLUMN referenciaId TEXT" },
    { name: "referenciaTipo",   sql: "ALTER TABLE Aviso ADD COLUMN referenciaTipo TEXT" },
  ],
  Notificacion: [
    { name: "fechaLectura",     sql: "ALTER TABLE Notificacion ADD COLUMN fechaLectura DATETIME" },
  ],
};

async function getExistingColumns(
  client: ReturnType<typeof createClient>,
  table: string,
): Promise<Set<string>> {
  const result = await client.execute(`PRAGMA table_info("${table}")`);
  return new Set(result.rows.map((r: any) => (r.name ?? r[1]) as string));
}

async function tableExists(
  client: ReturnType<typeof createClient>,
  table: string,
): Promise<boolean> {
  const result = await client.execute({
    sql: `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
    args: [table],
  });
  return result.rows.length > 0;
}

async function main() {
  const secrets = SecretsManager.getInstance();
  await secrets.initialize();
  const { DATABASE_URL, AUTH_TOKEN } = secrets.getTursoSecrets();
  const client = createClient({ url: DATABASE_URL, authToken: AUTH_TOKEN });

  let applied = 0;
  let skipped = 0;
  let errors = 0;

  for (const [table, columns] of Object.entries(EXPECTED_COLUMNS)) {
    if (!(await tableExists(client, table))) {
      console.warn(`⚠️  Tabla ${table} no existe en producción — saltando`);
      continue;
    }

    const existing = await getExistingColumns(client, table);

    for (const col of columns) {
      if (existing.has(col.name)) {
        console.log(`  ✓  ${table}.${col.name} ya existe`);
        skipped++;
        continue;
      }

      try {
        await client.execute(col.sql);
        console.log(`  ✅ ${table}.${col.name} agregada`);
        applied++;
      } catch (e: any) {
        const msg: string = e?.message ?? "";
        if (msg.includes("duplicate column") || msg.includes("already exists")) {
          console.log(`  ✓  ${table}.${col.name} ya existe (race)`);
          skipped++;
        } else {
          console.error(`  ❌ ${table}.${col.name}: ${msg}`);
          errors++;
        }
      }
    }
  }

  console.log(`\nSync completado — aplicadas: ${applied}, ya existían: ${skipped}, errores: ${errors}`);
  if (errors > 0) process.exit(1);
}

main().catch((err) => { console.error(err); process.exit(1); });
