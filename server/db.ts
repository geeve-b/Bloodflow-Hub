import "dotenv/config";
import { MongoClient } from "mongodb";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create MongoDB client
const client = new MongoClient(process.env.DATABASE_URL);

// Export database instance
export const mongoClient = client;
export const db = client.db("bloodflow_hub");

// Track connection state
let _isConnected = false;
export const isDbConnected = () => _isConnected;

// Connect to MongoDB with timeout and graceful fallback
export async function connectDatabase() {
  try {
    // Set a 10-second timeout for connection attempts
    const connectPromise = client.connect();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Connection timeout")), 10000)
    );

    await Promise.race([connectPromise, timeoutPromise]);
    _isConnected = true;
    console.log("✓ Connected to MongoDB Atlas");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn("⚠ MongoDB connection failed:", errorMessage);
    console.warn("⚠ Continuing in memory mode");
    console.warn("   To fix: Whitelist your IP in MongoDB Atlas Network Access settings");
  }
}

export async function closeDatabase() {
  await client.close();
}
