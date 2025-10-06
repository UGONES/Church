import { Router } from "express";
import {
  getServiceTimes,
  getChurchStats,
  getHeroContent,
  getLiveStatus,
  trackEvent,
  getDashboardStats,
  getRecentActivity,
} from "../controllers/analyticsController.mjs";
import { auth } from "../middleware/auth.mjs";
import { adminCheck } from "../middleware/adminCheck.mjs";
const router = Router();

// Public routes
router.get("/service-times", getServiceTimes);
router.get("/stats", getChurchStats);
router.get("/hero-content", getHeroContent);
router.get("/live-status", getLiveStatus);

// Authenticated routes
router.post("/track", auth, trackEvent);

// Admin routes
router.get("/admin/dashboard/stats", auth, adminCheck, getDashboardStats);
router.get("/admin/activity/recent", auth, adminCheck, getRecentActivity);

export default router;
