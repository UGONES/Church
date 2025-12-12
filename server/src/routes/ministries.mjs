import { Router } from "express";
import {
  getAllMinistries,
  getVolunteerOpportunities,
  getMinistryCategories,
  getUserMinistries,
  volunteerForMinistry,
  contactMinistryLeaders,
  createMinistry,
  updateMinistry,
  deleteMinistry,
  getMinistryStats,
  getMinistryVolunteers,
  addMinistryCategory,
} from "../controllers/ministryController.mjs";
import { auth, optionalAuth } from "../middleware/auth.mjs";
import { moderatorCheck } from "../middleware/adminCheck.mjs";
import { uploadImage } from "../middleware/upload.mjs";
const router = Router();

// Public routes
router.get("/", getAllMinistries);
router.get("/volunteer-opportunities", getVolunteerOpportunities);
router.get("/categories", getMinistryCategories);

// Authenticated routes
router.get("/user/ministries", optionalAuth, getUserMinistries);
router.post("/:id/volunteer", auth, volunteerForMinistry);
router.post("/:id/contact", auth, contactMinistryLeaders);

// Admin routes - ADDED /admin PREFIX
router.post(
  "/admin/create",
  auth,
  moderatorCheck,
  uploadImage.single("image"),
  createMinistry,
);
router.put(
  "/admin/update/:id",
  auth,
  moderatorCheck,
  uploadImage.single("image"),
  updateMinistry,
);
router.delete("/admin/delete/:id", auth, moderatorCheck, deleteMinistry);
router.post("/admin/categories", auth, moderatorCheck, addMinistryCategory);
router.get("/admin/stats", auth, moderatorCheck, getMinistryStats);
router.get(
  "/admin/:id/volunteers",
  auth,
  moderatorCheck,
  getMinistryVolunteers,
);

export default router;
