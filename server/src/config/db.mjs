import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// --- Helper function with retry ---
const connectDB = async (retries = 5, delay = 5000) => {
  try {
    console.log("⏳ Attempting MongoDB connection...");

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10s timeout for server selection
      socketTimeoutMS: 45000,          // 45s socket timeout
    });

    console.log(`🚀 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ Database connection error:", error.message);

    if (error.message.includes("EAI_AGAIN")) {
      console.warn("🌐 DNS issue detected — retrying after 5s...");
    }

    if (retries > 0) {
      console.log(`🔁 Retrying... (${retries} attempts left)`);
      setTimeout(() => connectDB(retries - 1, delay), delay);
    } else {
      console.error("💥 All MongoDB connection attempts failed. Exiting.");
      process.exit(1);
    }
  }
};

export default connectDB;
