import "dotenv/config";
import pg from "pg";
import { ensureTablesExist, pool } from "../server/db";

/**
 * Migration Utility: MongoDB -> PostgreSQL
 *
 * Usage:
 *   npx tsx scripts/migrate-mongo-to-postgres.ts
 *
 * Environment variables:
 *   DATABASE_URL : PostgreSQL connection string
 *   MONGO_URI / OLD_MONGO_URI : MongoDB connection string
 */
async function migrateData() {
  const mongoUri =
    process.env.OLD_MONGO_URI ||
    process.env.MONGO_URI ||
    (process.env.DATABASE_URL?.startsWith("mongodb")
      ? process.env.DATABASE_URL
      : null);

  if (!mongoUri) {
    console.log("ℹ No MongoDB connection string provided in MONGO_URI or OLD_MONGO_URI.");
    console.log("  To migrate existing data from MongoDB to PostgreSQL, run:");
    console.log("  OLD_MONGO_URI=\"mongodb+srv://...\" DATABASE_URL=\"postgresql://...\" npx tsx scripts/migrate-mongo-to-postgres.ts\n");
    return;
  }

  console.log("==================================================");
  console.log("  Bloodflow Hub: MongoDB -> PostgreSQL Migration  ");
  console.log("==================================================");

  let MongoClient: any;
  try {
    const mongoModule = await import("mongodb");
    MongoClient = mongoModule.MongoClient;
  } catch {
    console.log("ℹ MongoDB client library not loaded. Ensure tables are created first.");
  }

  if (!MongoClient) {
    console.log("Skipping MongoDB import step.");
    return;
  }

  const mongoClient = new MongoClient(mongoUri);

  try {
    console.log("1. Connecting to MongoDB...");
    await mongoClient.connect();
    console.log("✓ Connected to MongoDB");

    const mongoDb = mongoClient.db();

    console.log("2. Verifying PostgreSQL tables...");
    await ensureTablesExist();
    console.log("✓ PostgreSQL tables verified");

    // Migrate Users
    console.log("\n3. Migrating Users...");
    const mongoUsers = await mongoDb.collection("users").find({}).toArray();
    let usersMigrated = 0;
    for (const u of mongoUsers) {
      const id = u._id?.toString() || crypto.randomUUID();
      await pool.query(
        `INSERT INTO users (id, username, password, email, email_verified, email_verification_code, email_verification_expires_at, reset_password_token, reset_password_expires, role, approval_status, rejection_reason, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (id) DO UPDATE SET
           username = EXCLUDED.username,
           email = EXCLUDED.email,
           updated_at = NOW()`,
        [
          id,
          u.username,
          u.password,
          u.email,
          Boolean(u.emailVerified),
          u.emailVerificationCode || null,
          u.emailVerificationExpiresAt ? new Date(u.emailVerificationExpiresAt) : null,
          u.resetPasswordToken || null,
          u.resetPasswordExpires ? new Date(u.resetPasswordExpires) : null,
          u.role || "donor",
          u.approvalStatus || null,
          u.rejectionReason || null,
          u.createdAt ? new Date(u.createdAt) : new Date(),
          u.updatedAt ? new Date(u.updatedAt) : new Date(),
        ]
      );
      usersMigrated++;
    }
    console.log(`✓ Migrated ${usersMigrated} user(s)`);

    // Migrate Donors
    console.log("\n4. Migrating Donors...");
    const mongoDonors = await mongoDb.collection("donors").find({}).toArray();
    let donorsMigrated = 0;
    for (const d of mongoDonors) {
      const id = d._id?.toString() || crypto.randomUUID();
      await pool.query(
        `INSERT INTO donors (id, user_id, first_name, last_name, blood_type, phone, address, state, region, last_donation_date, latitude, longitude, availability_windows, eligibility_status, eligibility_notes, deferral_until, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
         ON CONFLICT (id) DO NOTHING`,
        [
          id,
          d.userId?.toString() || id,
          d.firstName || "",
          d.lastName || "",
          d.bloodType || "O+",
          d.phone || "",
          d.address || "",
          d.state || null,
          d.region || null,
          d.lastDonationDate ? new Date(d.lastDonationDate) : null,
          d.latitude ?? null,
          d.longitude ?? null,
          d.availabilityWindows ? JSON.stringify(d.availabilityWindows) : null,
          d.eligibilityStatus || "eligible",
          d.eligibilityNotes ? JSON.stringify(d.eligibilityNotes) : null,
          d.deferralUntil ? new Date(d.deferralUntil) : null,
          d.isActive !== false,
          d.createdAt ? new Date(d.createdAt) : new Date(),
          d.updatedAt ? new Date(d.updatedAt) : new Date(),
        ]
      );
      donorsMigrated++;
    }
    console.log(`✓ Migrated ${donorsMigrated} donor(s)`);

    // Migrate Staff
    console.log("\n5. Migrating Staff...");
    const mongoStaff = await mongoDb.collection("staff").find({}).toArray();
    let staffMigrated = 0;
    for (const s of mongoStaff) {
      const id = s._id?.toString() || crypto.randomUUID();
      await pool.query(
        `INSERT INTO staff (id, user_id, first_name, last_name, staff_id, department, position, phone, email, hospital_name, staff_id_document, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO NOTHING`,
        [
          id,
          s.userId?.toString() || id,
          s.firstName || "",
          s.lastName || "",
          s.staffId || "N/A",
          s.department || "General",
          s.position || "Staff",
          s.phone || "",
          s.email || "",
          s.hospitalName || "",
          s.staff_id_document || null,
          s.createdAt ? new Date(s.createdAt) : new Date(),
          s.updatedAt ? new Date(s.updatedAt) : new Date(),
        ]
      );
      staffMigrated++;
    }
    console.log(`✓ Migrated ${staffMigrated} staff member(s)`);

    // Migrate Blood Inventory
    console.log("\n6. Migrating Blood Inventory...");
    const mongoInventory = await mongoDb.collection("bloodInventory").find({}).toArray();
    let inventoryMigrated = 0;
    for (const i of mongoInventory) {
      const id = i._id?.toString() || crypto.randomUUID();
      await pool.query(
        `INSERT INTO blood_inventory (id, hospital_id, hospital_name, blood_type, quantity, expiry_date, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO NOTHING`,
        [
          id,
          i.hospitalId || "",
          i.hospitalName || "",
          i.bloodType || "O+",
          Number(i.quantity) || 0,
          i.expiryDate ? new Date(i.expiryDate) : new Date(Date.now() + 30 * 86400000),
          i.status || "available",
          i.createdAt ? new Date(i.createdAt) : new Date(),
          i.updatedAt ? new Date(i.updatedAt) : new Date(),
        ]
      );
      inventoryMigrated++;
    }
    console.log(`✓ Migrated ${inventoryMigrated} inventory item(s)`);

    // Migrate Blood Requests
    console.log("\n7. Migrating Blood Requests...");
    const mongoRequests = await mongoDb.collection("bloodRequests").find({}).toArray();
    let requestsMigrated = 0;
    for (const r of mongoRequests) {
      const id = r._id?.toString() || crypto.randomUUID();
      await pool.query(
        `INSERT INTO blood_requests (id, requester_id, requester_name, hospital_name, hospital_latitude, hospital_longitude, region, address, country, state, blood_type, quantity, urgency, patient_name, contact_number, secondary_contact_number, reason, status, approved_by_hospital_id, approved_by_hospital_name, priority_score, rejection_reason, fulfilled_by_hospital_id, fulfilled_by_hospital_name, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
         ON CONFLICT (id) DO NOTHING`,
        [
          id,
          r.requesterId || "",
          r.requesterName || "",
          r.hospitalName || "",
          r.hospitalLatitude ?? null,
          r.hospitalLongitude ?? null,
          r.region || "",
          r.address || "",
          r.country || null,
          r.state || null,
          r.bloodType || "O+",
          Number(r.quantity) || 1,
          r.urgency || "normal",
          r.patientName || "",
          r.contactNumber || "",
          r.secondaryContactNumber || null,
          r.reason || null,
          r.status || "pending",
          r.approvedByHospitalId || null,
          r.approvedByHospitalName || null,
          r.priorityScore ?? 0.5,
          r.rejectionReason || null,
          r.fulfilledByHospitalId || null,
          r.fulfilledByHospitalName || null,
          r.createdAt ? new Date(r.createdAt) : new Date(),
          r.updatedAt ? new Date(r.updatedAt) : new Date(),
        ]
      );
      requestsMigrated++;
    }
    console.log(`✓ Migrated ${requestsMigrated} blood request(s)`);

    console.log("\n==================================================");
    console.log("  Migration from MongoDB to PostgreSQL Completed!  ");
    console.log("==================================================");
  } catch (error) {
    console.error("❌ Migration error:", error);
  } finally {
    await mongoClient.close();
    await pool.end();
  }
}

migrateData();
