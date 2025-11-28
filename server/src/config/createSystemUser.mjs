import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const createSystemUser = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("❌ MONGODB_URI not found in .env file");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Check if system user already exists
    let systemUser = await User.findOne({ email: "system@church.com" });
    if (!systemUser) {
      systemUser = await User.create({
        name: "System Seeder",
        firstName: "System",
        lastName: "Seeder",
        email: "system@church.com",
        password: "SeederPass123!",
        role: "admin",
        authMethod: "local",
        emailVerified: true,
      });
      console.log("👤 Created system seeder user");
    } else {
      console.log("ℹ️ System user already exists");
    }

    console.log("🎉 System user ready");
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to create system user", err);
    process.exit(1);
  }
};

createSystemUser();
