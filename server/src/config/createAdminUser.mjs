// config/createAdminUser.mjs
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const createAdminUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const adminUser = await User.create({
      name: "Church Admin",
      firstName: "Church",
      lastName: "Admin",
      email: "admin@church.com", 
      password: "AdminPass123!", 
      role: "admin",
      authMethod: "local",
      emailVerified: true,
    });

    console.log("✅ Admin user created:", adminUser.email);
    console.log("📧 Email:", adminUser.email);
    console.log("🔑 Password: AdminPass123!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to create admin user", err);
    process.exit(1);
  }
};

createAdminUser();
