import "dotenv/config";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  "postgresql://postgres:postgres@localhost:5432/bloodflow_hub";

// Create PostgreSQL connection pool
const isRemoteDb =
  connectionString.includes("supabase.co") ||
  connectionString.includes("supabase.com") ||
  connectionString.includes("neon.tech") ||
  connectionString.includes("render.com") ||
  connectionString.includes("sslmode=require");

export const pool = new Pool({
  connectionString,
  ssl: isRemoteDb ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 30000,
  max: 20,
});

// Export Drizzle database instance
export const db = drizzle(pool, { schema });

// Track connection state
let _isConnected = false;
export const isDbConnected = () => _isConnected;

/**
 * Automatically creates all tables and indexes if they don't already exist.
 * This guarantees zero-config startup on any fresh PostgreSQL instance.
 */
export async function ensureTablesExist() {
  const ddl = `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      password TEXT NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      email_verified BOOLEAN NOT NULL DEFAULT FALSE,
      email_verification_code TEXT,
      email_verification_expires_at TIMESTAMP,
      reset_password_token TEXT,
      reset_password_expires TIMESTAMP,
      role VARCHAR(32) NOT NULL DEFAULT 'donor',
      approval_status VARCHAR(32),
      rejection_reason TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS blood_inventory (
      id VARCHAR(64) PRIMARY KEY,
      hospital_id VARCHAR(64) NOT NULL,
      hospital_name TEXT NOT NULL,
      blood_type VARCHAR(8) NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      expiry_date TIMESTAMP NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'available',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS blood_requests (
      id VARCHAR(64) PRIMARY KEY,
      requester_id VARCHAR(64) NOT NULL,
      requester_name TEXT NOT NULL,
      hospital_name TEXT NOT NULL,
      hospital_latitude DOUBLE PRECISION,
      hospital_longitude DOUBLE PRECISION,
      region TEXT NOT NULL,
      address TEXT NOT NULL,
      country TEXT,
      state TEXT,
      blood_type VARCHAR(8) NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      urgency VARCHAR(32) NOT NULL DEFAULT 'normal',
      patient_name TEXT NOT NULL,
      contact_number VARCHAR(64) NOT NULL,
      secondary_contact_number VARCHAR(64),
      reason TEXT,
      status VARCHAR(32) NOT NULL DEFAULT 'pending',
      approved_by_hospital_id VARCHAR(64),
      approved_by_hospital_name TEXT,
      priority_score DOUBLE PRECISION DEFAULT 0.5,
      rejection_reason TEXT,
      fulfilled_by_hospital_id VARCHAR(64),
      fulfilled_by_hospital_name TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS donors (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      blood_type VARCHAR(8) NOT NULL,
      phone VARCHAR(64) NOT NULL,
      address TEXT NOT NULL,
      state TEXT,
      region TEXT,
      last_donation_date TIMESTAMP,
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      availability_windows JSONB,
      eligibility_status VARCHAR(32) NOT NULL DEFAULT 'eligible',
      eligibility_notes JSONB,
      deferral_until TIMESTAMP,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS staff (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      staff_id VARCHAR(64) NOT NULL,
      department TEXT NOT NULL,
      position TEXT NOT NULL,
      phone VARCHAR(64) NOT NULL,
      email VARCHAR(255) NOT NULL,
      hospital_name TEXT NOT NULL,
      staff_id_document TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS receivers (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      blood_type VARCHAR(8) NOT NULL,
      phone VARCHAR(64) NOT NULL,
      address TEXT NOT NULL,
      hospital_name TEXT NOT NULL,
      medical_condition TEXT,
      urgency_level VARCHAR(32) NOT NULL DEFAULT 'normal',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS donor_responses (
      id VARCHAR(64) PRIMARY KEY,
      request_id VARCHAR(64) NOT NULL,
      donor_id VARCHAR(64) NOT NULL,
      donor_email VARCHAR(255) NOT NULL,
      donor_name TEXT NOT NULL,
      token TEXT NOT NULL,
      response VARCHAR(32) NOT NULL DEFAULT 'pending',
      responded_at TIMESTAMP,
      token_expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS blood_expiry_alerts (
      id VARCHAR(64) PRIMARY KEY,
      inventory_id VARCHAR(64) NOT NULL,
      hospital_id VARCHAR(64) NOT NULL,
      hospital_name TEXT NOT NULL,
      blood_type VARCHAR(8) NOT NULL,
      quantity INTEGER NOT NULL,
      expiry_date TIMESTAMP NOT NULL,
      days_remaining INTEGER NOT NULL,
      alert_level VARCHAR(32) NOT NULL,
      alert_sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
      emails_sent JSONB NOT NULL DEFAULT '[]',
      acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
      acknowledged_by VARCHAR(64),
      acknowledged_at TIMESTAMP,
      acknowledged_notes TEXT,
      resolved BOOLEAN NOT NULL DEFAULT FALSE,
      resolved_by VARCHAR(64),
      resolved_at TIMESTAMP,
      resolved_notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS blood_donation_tracking (
      id VARCHAR(64) PRIMARY KEY,
      donor_id VARCHAR(64) NOT NULL,
      donor_name TEXT NOT NULL,
      donor_email VARCHAR(255) NOT NULL,
      blood_type VARCHAR(8) NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      donation_date TIMESTAMP NOT NULL DEFAULT NOW(),
      hospital_id VARCHAR(64) NOT NULL,
      hospital_name TEXT NOT NULL,
      receiver_id VARCHAR(64),
      receiver_name TEXT,
      receiver_hospital_name TEXT,
      medical_condition TEXT,
      urgency_level VARCHAR(32) DEFAULT 'normal',
      status VARCHAR(32) NOT NULL DEFAULT 'collected',
      collection_time TIMESTAMP,
      transit_start_time TIMESTAMP,
      received_time TIMESTAMP,
      usage_start_time TIMESTAMP,
      transfusion_complete_time TIMESTAMP,
      tracking_notes JSONB NOT NULL DEFAULT '[]',
      is_successful BOOLEAN,
      outcome_notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS inter_hospital_requests (
      id VARCHAR(64) PRIMARY KEY,
      requesting_hospital_id VARCHAR(64) NOT NULL,
      requesting_hospital_name TEXT NOT NULL,
      requesting_hospital_location TEXT,
      requesting_hospital_phone VARCHAR(64),
      providing_hospital_id VARCHAR(64),
      providing_hospital_name TEXT,
      blood_type VARCHAR(8) NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      urgency VARCHAR(32) NOT NULL DEFAULT 'normal',
      reason TEXT,
      status VARCHAR(32) NOT NULL DEFAULT 'pending',
      rejection_reason TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Create optimal indexes
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_donors_user_id ON donors(user_id);
    CREATE INDEX IF NOT EXISTS idx_donors_blood_type ON donors(blood_type);
    CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);
    CREATE INDEX IF NOT EXISTS idx_staff_hospital ON staff(hospital_name);
    CREATE INDEX IF NOT EXISTS idx_receivers_user_id ON receivers(user_id);
    CREATE INDEX IF NOT EXISTS idx_blood_inventory_hospital ON blood_inventory(hospital_id);
    CREATE INDEX IF NOT EXISTS idx_blood_inventory_blood_type ON blood_inventory(blood_type);
    CREATE INDEX IF NOT EXISTS idx_blood_inventory_expiry ON blood_inventory(expiry_date);
    CREATE INDEX IF NOT EXISTS idx_blood_requests_blood_type ON blood_requests(blood_type);
    CREATE INDEX IF NOT EXISTS idx_blood_requests_status ON blood_requests(status);
    CREATE INDEX IF NOT EXISTS idx_blood_requests_urgency ON blood_requests(urgency);
    CREATE INDEX IF NOT EXISTS idx_blood_requests_created ON blood_requests(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_blood_expiry_alerts_hospital ON blood_expiry_alerts(hospital_id);
    CREATE INDEX IF NOT EXISTS idx_blood_expiry_alerts_resolved ON blood_expiry_alerts(resolved);
    CREATE INDEX IF NOT EXISTS idx_donation_tracking_donor ON blood_donation_tracking(donor_id);
    CREATE INDEX IF NOT EXISTS idx_donation_tracking_receiver ON blood_donation_tracking(receiver_id);
    CREATE INDEX IF NOT EXISTS idx_donation_tracking_hospital ON blood_donation_tracking(hospital_id);
    CREATE INDEX IF NOT EXISTS idx_inter_hospital_requesting ON inter_hospital_requests(requesting_hospital_id);
    CREATE INDEX IF NOT EXISTS idx_inter_hospital_providing ON inter_hospital_requests(providing_hospital_id);
  `;

  await pool.query(ddl);
  console.log("✓ PostgreSQL tables and indexes verified/created successfully");
}

// Connect to PostgreSQL with timeout and graceful fallback
export async function connectDatabase() {
  try {
    const client = await pool.connect();
    try {
      await client.query("SELECT 1");
      _isConnected = true;
      console.log("✓ Connected to PostgreSQL Database");
      await ensureTablesExist();
    } finally {
      client.release();
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn("⚠ PostgreSQL connection failed:", errorMessage);
    console.warn("⚠ Continuing in memory fallback mode");
    console.warn(
      "   To fix: Ensure PostgreSQL is running and DATABASE_URL is set in .env"
    );
  }
}

export async function closeDatabase() {
  await pool.end();
}
