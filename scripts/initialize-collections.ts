import "dotenv/config";
import { ensureTablesExist, pool } from "../server/db";

// Creates all tables and indexes. The server also does this on startup, so running
// this script is only needed to prepare a database ahead of the first deploy.
async function initializeDatabase() {
  try {
    console.log("Connecting to PostgreSQL...");
    await ensureTablesExist();
    console.log("✓ Database is ready");
  } catch (error) {
    console.error("✗ Database initialization failed:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

initializeDatabase();
