import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import AdminCode from "../models/AdminCode.mjs";
import User from "../models/User.mjs"; // import user model

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.join(__dirname, "../.env") });

const seed = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("❌ MONGODB_URI not found in .env file");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // 1️⃣ Ensure a system seeder user exists
    let systemUser = await User.findOne({ email: "system@church.com" });
    if (!systemUser) {
      systemUser = await User.create({
        name: "System Seeder",
        firstName: "System",
        lastName: "Seeder",
        email: "system@church.com",
        password: "SeederPass123!", // hashed by pre-save
        role: "admin",
        authMethod: "local",
        emailVerified: true,
      });
      console.log("👤 Created system seeder user");
    }

    // 2️⃣ Gather codes from .env
    const adminCodes = [
      process.env.ADMIN_INITIAL_CODE1,
      process.env.ADMIN_INITIAL_CODE2,
      process.env.ADMIN_INITIAL_CODE3,
    ];

    const moderatorCodes = [
      process.env.MODERATOR_INITIAL_CODE1,
      process.env.MODERATOR_INITIAL_CODE2,
      process.env.MODERATOR_INITIAL_CODE3,
    ];

    const codes = [
      ...adminCodes.map((c) => ({
        code: c?.toUpperCase(),
        role: "admin",
        maxUsage: 5,
        expiresAt: new Date("2026-01-01"),
        createdBy: systemUser._id,
      })),
      ...moderatorCodes.map((c) => ({
        code: c?.toUpperCase(),
        role: "moderator",
        maxUsage: 10,
        expiresAt: new Date("2026-01-01"),
        createdBy: systemUser._id,
      })),
    ];

    // 3️⃣ Insert or skip
    for (const code of codes) {
      if (!code.code) continue;
      const exists = await AdminCode.findOne({ code: code.code });
      if (!exists) {
        await AdminCode.create(code);
        console.log(`✅ Seeded ${code.role} code: ${code.code}`);
      } else {
        console.log(`ℹ️ Code ${code.code} already exists`);
      }
    }

    console.log("🎉 Admin/Moderator codes ready");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed", err);
    process.exit(1);
  }
};

seed();
