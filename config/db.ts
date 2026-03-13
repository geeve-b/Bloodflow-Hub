import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.warn("⚠ MONGO_URI not set. Running in memory mode.");
      return;
    }
    
    // Set connection timeout to 10 seconds
    const connectPromise = mongoose.connect(mongoUri);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Connection timeout")), 10000)
    );
    
    await Promise.race([connectPromise, timeoutPromise]);
    console.log("✓ MongoDB Atlas Connected Successfully");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn("⚠ MongoDB connection failed:", errorMessage);
    console.log("⚠ Running in memory mode for development");
  }
};

export default connectDB;
