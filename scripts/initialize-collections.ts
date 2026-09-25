import "dotenv/config";
import pg from "pg";
import { ensureTablesExist, pool } from "../server/db";

async function initializeDatabase() {
  console.log("==========================================");
  console.log("  Bloodflow Hub - PostgreSQL Initializer  ");
  console.log("==========================================");

  try {
    console.log("Connecting to PostgreSQL...");
    const client = await pool.connect();
    console.log("✓ Connected to PostgreSQL successfully");
    client.release();

    // Verify and create tables and indexes
    console.log("Creating/verifying tables and indexes...");
    await ensureTablesExist();

    // Insert sample data if not exists
    const sampleDonorUserId = "sample-donor-user-id";
    const donorCheck = await pool.query(
      "SELECT id FROM donors WHERE user_id = $1 LIMIT 1",
      [sampleDonorUserId]
    );

    if (donorCheck.rows.length === 0) {
      await pool.query(
        `INSERT INTO donors (id, user_id, first_name, last_name, blood_type, phone, address, state, region, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
        [
          crypto.randomUUID(),
          sampleDonorUserId,
          "John",
          "Donor",
          "O+",
          "+1-555-0101",
          "123 Main St, City",
          "State",
          "North Region",
          true,
        ]
      );
      console.log("✓ Inserted sample donor");
    } else {
      console.log("ℹ Sample donor already exists");
    }

    const sampleReceiverUserId = "sample-receiver-user-id";
    const receiverCheck = await pool.query(
      "SELECT id FROM receivers WHERE user_id = $1 LIMIT 1",
      [sampleReceiverUserId]
    );

    if (receiverCheck.rows.length === 0) {
      await pool.query(
        `INSERT INTO receivers (id, user_id, first_name, last_name, blood_type, phone, address, hospital_name, medical_condition, urgency_level, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
        [
          crypto.randomUUID(),
          sampleReceiverUserId,
          "Jane",
          "Patient",
          "AB-",
          "+1-555-0102",
          "456 Oak Ave, City",
          "Central Hospital",
          "Emergency Surgery",
          "normal",
        ]
      );
      console.log("✓ Inserted sample receiver");
    } else {
      console.log("ℹ Sample receiver already exists");
    }

    const sampleHospitalId = "hospital-001";
    const inventoryCheck = await pool.query(
      "SELECT id FROM blood_inventory WHERE hospital_id = $1 LIMIT 1",
      [sampleHospitalId]
    );

    if (inventoryCheck.rows.length === 0) {
      const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await pool.query(
        `INSERT INTO blood_inventory (id, hospital_id, hospital_name, blood_type, quantity, expiry_date, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [
          crypto.randomUUID(),
          sampleHospitalId,
          "Central Hospital",
          "O+",
          50,
          expiry,
          "available",
        ]
      );
      console.log("✓ Inserted sample blood inventory");
    } else {
      console.log("ℹ Sample blood inventory already exists");
    }

    // Display table statistics
    console.log("\n📊 PostgreSQL Table Status:");
    const tables = [
      "users",
      "donors",
      "receivers",
      "staff",
      "blood_inventory",
      "blood_requests",
      "donor_responses",
      "blood_expiry_alerts",
      "blood_donation_tracking",
    ];

    for (const tableName of tables) {
      const res = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      console.log(`  - ${tableName}: ${res.rows[0].count} row(s)`);
    }

    console.log("\n✅ PostgreSQL database initialization complete!");
  } catch (error) {
    console.error("❌ Initialization error:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initializeDatabase();
