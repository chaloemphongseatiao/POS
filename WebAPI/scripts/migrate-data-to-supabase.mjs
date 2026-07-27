import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import initSqlJs from "sql.js";
import pg from "pg";
import "dotenv/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "..", "prisma", "dev.db");

const TABLES_IN_ORDER = [
  "User",
  "Category",
  "Product",
  "Stock",
  "StockMovement",
  "Order",
  "OrderItem",
  "Setting",
];

function rowsFromSqlite(db, table) {
  const res = db.exec(`SELECT * FROM "${table}"`);
  if (res.length === 0) return [];
  const [{ columns, values }] = res;
  return values.map((row) => Object.fromEntries(columns.map((c, i) => [c, row[i]])));
}

const DATETIME_COLUMNS = new Set(["createdAt", "updatedAt"]);
const BOOLEAN_COLUMNS = new Set(["isActive"]);

function toPgValue(column, v) {
  if (DATETIME_COLUMNS.has(column) && typeof v === "number") {
    return new Date(v);
  }
  if (BOOLEAN_COLUMNS.has(column) && typeof v === "number") {
    return v === 1;
  }
  return v;
}

async function main() {
  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(dbPath);
  const sqliteDb = new SQL.Database(fileBuffer);

  const directUrl = new URL(process.env.DIRECT_URL);
  const client = new pg.Client({
    host: directUrl.hostname,
    port: directUrl.port,
    database: directUrl.pathname.slice(1),
    user: decodeURIComponent(directUrl.username),
    password: decodeURIComponent(directUrl.password),
    ssl: { rejectUnauthorized: false },
    keepAlive: true,
    query_timeout: 30000,
  });
  await client.connect();

  try {
    await client.query("BEGIN");

    for (const table of TABLES_IN_ORDER) {
      const rows = rowsFromSqlite(sqliteDb, table);
      console.log(`${table}: ${rows.length} rows`);
      if (rows.length === 0) continue;

      const columns = Object.keys(rows[0]);
      const colList = columns.map((c) => `"${c}"`).join(", ");

      for (const row of rows) {
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
        const values = columns.map((c) => toPgValue(c, row[c]));
        await client.query(
          `INSERT INTO "${table}" (${colList}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`,
          values
        );
      }

      const seqResult = await client.query(
        `SELECT pg_get_serial_sequence($1, 'id') AS seq`,
        [`"${table}"`]
      );
      const seqName = seqResult.rows[0]?.seq;
      if (seqName) {
        await client.query(
          `SELECT setval($1, COALESCE((SELECT MAX(id) FROM "${table}"), 1), true)`,
          [seqName]
        );
      }
    }

    await client.query("COMMIT");
    console.log("Done. All data migrated to Supabase.");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
