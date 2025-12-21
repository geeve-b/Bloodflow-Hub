import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.warn("⚠ MONGO_URI not set. Running in memory mode.");
      return;
    }
    
    await mongoose.connect(mongoUri);
    console.log("✓ MongoDB Atlas Connected Successfully");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn("⚠ MongoDB connection failed:", errorMessage);
    console.log("⚠ Running in memory mode for testing");
  }
};

export default connectDB;
