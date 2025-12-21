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

// Connect to MongoDB
export async function connectDatabase() {
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}

export async function closeDatabase() {
  await client.close();
}
