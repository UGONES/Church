import express from "express";
import passport from "passport";
import cors from "cors";
import helmet from "helmet";
import cloudinary from "./src/config/cloudinary.mjs";

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./src/config/db.mjs";
import { verifyEmailConnection } from "./src/utils/emailService.mjs";
import rateLimiters from "./src/middleware/rateLimit.mjs";

// Routes
import analyiticsRoutes from "./src/routes/analytics.mjs";
import authRoutes from "./src/routes/auth.mjs";
import userRoutes from "./src/routes/users.mjs";
import eventRoutes from "./src/routes/events.mjs";
import sermonRoutes from "./src/routes/sermons.mjs";
import donationRoutes from "./src/routes/donations.mjs";
import prayerRoutes from "./src/routes/prayers.mjs";
import testimonialRoutes from "./src/routes/testimonials.mjs";
import ministryRoutes from "./src/routes/ministries.mjs";
import volunteerRoutes from "./src/routes/volunteers.mjs";
import blogRoutes from "./src/routes/blogs.mjs";
import analyticsRoutes from "./src/routes/analytics.mjs";
import adminRoutes from "./src/routes/admin.mjs";
import settingsRoutes from "./src/routes/settings.mjs";
import webhookRoutes from "./src/routes/webhooks.mjs";
import socialAuthRoutes from "./src/routes/socialAuth.mjs";

import errorHandler from "./src/middleware/errorHandlers.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "./src/.env") });

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

// Rate limiting
app.use(rateLimiters.generalLimiter);

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.use((req, res, next) => {
  console.log(`📥 [${req.method}] ${req.url}`);
  next();
});

// Database connection
connectDB();

// Use routes
app.use("/api/analytics", analyiticsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/sermons", sermonRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/prayers", prayerRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/ministries", ministryRoutes);
app.use("/api/volunteers", volunteerRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/auth/social", socialAuthRoutes);

// Catch-all for missing routes
app.use((req, res, next) => {
  console.warn(`🚫 Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
  });
});

// Error handling middleware
app.use(errorHandler);

// Root route - essential!
app.get("/", (req, res) =>
  res.json({
    message: "Church API Server is running!",
    status: "OK",
    timestamp: new Date().toISOString(),
  }),
);

// Health check endpoint
app.get("/health", (req, res) =>
  res.status(200).json({
    status: "✅ OK",
    message: "🚀 Server is running",
    timestamp: new Date().toISOString(),
  }),
);

const PORT = process.env.PORT || 5000;
const startServer = async () => {
  try {
    // Verify email connection
    const emailConnected = await verifyEmailConnection();
    if (!emailConnected) {
      console.warn(
        "⚠️  Email service not configured. Verification emails will not be sent.",
      );
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port http://localhost:${PORT}`);
      console.log(`📋 API Documentation: http://localhost:${PORT}/api-docs`);
      if (emailConnected) {
        console.log("✅ Email service: Ready to send verification emails");
      }
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;
