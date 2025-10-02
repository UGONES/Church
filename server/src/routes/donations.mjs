// donationRoutes.mjs
import { Router } from "express";
import {
  getUserDonations,
  createDonation,
  downloadReceipt,
  getAllDonations,
  updateDonation,
  getDonationStats,
  getRecentDonations,
  exportDonations,
  createPaymentIntent,
  confirmCardPayment,
} from "../controllers/donationController.mjs";
import { auth, optionalAuth } from "../middleware/auth.mjs";
import { moderatorCheck } from "../middleware/adminCheck.mjs";
const router = Router();

// Payment intent creation (public)
router.post("/create-payment-intent", optionalAuth, createPaymentIntent);

// Authenticated routes
router.get("/", auth, getUserDonations);
router.post("/create", optionalAuth, createDonation); // Changed to optionalAuth
router.post("/confirm-payment", optionalAuth, confirmCardPayment); // New endpoint
router.get("/receipt/:id", auth, downloadReceipt);

// Admin routes
router.get("/admin/all", auth, moderatorCheck, getAllDonations);
router.put("/admin/update/:id", auth, moderatorCheck, updateDonation);
router.get("/admin/stats", auth, moderatorCheck, getDonationStats);
router.get("/admin/recent", auth, moderatorCheck, getRecentDonations);
router.get("/admin/export", auth, moderatorCheck, exportDonations);

export default router;
