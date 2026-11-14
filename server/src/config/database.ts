
import mongoose from "mongoose";

export async function connectDatabase(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error(
      "MONGODB_URI is missing from environment variables."
    );
  }

  try {
    await mongoose.connect(mongoUri);

    console.log("MongoDB connected successfully.");
    console.log(`Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    throw error;
  }
}
