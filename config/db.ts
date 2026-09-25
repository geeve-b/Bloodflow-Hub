import { connectDatabase } from "../server/db";

export const connectDB = async () => {
  await connectDatabase();
};

export default connectDB;
