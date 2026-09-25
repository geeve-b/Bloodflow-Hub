import { pool } from "./db";

/**
 * PostgreSQL Index Management for Bloodflow Hub
 *
 * Creates optimal B-tree and composite indexes on PostgreSQL tables
 * for high query performance across requests, inventory, donors, and staff.
 */
export async function createOptimalIndexes(): Promise<void> {
  const indexStatements = [
    // Users indexes
    `CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);`,
    `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`,
    `CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);`,

    // Blood Requests indexes
    `CREATE INDEX IF NOT EXISTS idx_blood_requests_blood_type ON blood_requests(blood_type);`,
    `CREATE INDEX IF NOT EXISTS idx_blood_requests_urgency ON blood_requests(urgency);`,
    `CREATE INDEX IF NOT EXISTS idx_blood_requests_status ON blood_requests(status);`,
    `CREATE INDEX IF NOT EXISTS idx_blood_requests_hospital ON blood_requests(hospital_name);`,
    `CREATE INDEX IF NOT EXISTS idx_blood_requests_created_at ON blood_requests(created_at DESC);`,
    `CREATE INDEX IF NOT EXISTS idx_blood_requests_composite ON blood_requests(blood_type, urgency, status);`,

    // Blood Inventory indexes
    `CREATE INDEX IF NOT EXISTS idx_blood_inventory_blood_type ON blood_inventory(blood_type);`,
    `CREATE INDEX IF NOT EXISTS idx_blood_inventory_hospital_id ON blood_inventory(hospital_id);`,
    `CREATE INDEX IF NOT EXISTS idx_blood_inventory_status ON blood_inventory(status);`,
    `CREATE INDEX IF NOT EXISTS idx_blood_inventory_expiry_date ON blood_inventory(expiry_date);`,
    `CREATE INDEX IF NOT EXISTS idx_blood_inventory_status_expiry ON blood_inventory(status, expiry_date);`,
    `CREATE INDEX IF NOT EXISTS idx_blood_inventory_type_status ON blood_inventory(blood_type, status);`,

    // Donors indexes
    `CREATE INDEX IF NOT EXISTS idx_donors_user_id ON donors(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_donors_blood_type ON donors(blood_type);`,
    `CREATE INDEX IF NOT EXISTS idx_donors_region ON donors(region);`,
    `CREATE INDEX IF NOT EXISTS idx_donors_active ON donors(is_active);`,

    // Staff indexes
    `CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_staff_hospital_name ON staff(hospital_name);`,
    `CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);`,

    // Receivers indexes
    `CREATE INDEX IF NOT EXISTS idx_receivers_user_id ON receivers(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_receivers_blood_type ON receivers(blood_type);`,

    // Blood Expiry Alerts indexes
    `CREATE INDEX IF NOT EXISTS idx_blood_expiry_alerts_hospital_id ON blood_expiry_alerts(hospital_id);`,
    `CREATE INDEX IF NOT EXISTS idx_blood_expiry_alerts_resolved ON blood_expiry_alerts(resolved);`,
    `CREATE INDEX IF NOT EXISTS idx_blood_expiry_alerts_inventory_id ON blood_expiry_alerts(inventory_id);`,

    // Donation Tracking indexes
    `CREATE INDEX IF NOT EXISTS idx_blood_donation_tracking_donor_id ON blood_donation_tracking(donor_id);`,
    `CREATE INDEX IF NOT EXISTS idx_blood_donation_tracking_receiver_id ON blood_donation_tracking(receiver_id);`,
    `CREATE INDEX IF NOT EXISTS idx_blood_donation_tracking_hospital_id ON blood_donation_tracking(hospital_id);`,
    `CREATE INDEX IF NOT EXISTS idx_blood_donation_tracking_status ON blood_donation_tracking(status);`,
  ];

  try {
    for (const sql of indexStatements) {
      await pool.query(sql);
    }
    console.log("[INFO] PostgreSQL database indexes created/verified successfully");
  } catch (error) {
    console.warn("[WARN] Some PostgreSQL indexes may already exist or failed:", error);
  }
}
