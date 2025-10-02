import { Router } from "express";
import {
  getAllTestimonials,
  getApprovedTestimonials,
  getVideoTestimonials,
  getTestimonialCategories,
  submitTestimonial,
  getAllTestimonialsAdmin,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  getTestimonialStats,
} from "../controllers/testimonialController.mjs";
import { auth, optionalAuth } from "../middleware/auth.mjs";
import { moderatorCheck } from "../middleware/adminCheck.mjs";
import { uploadImage } from "../middleware/upload.mjs";
const router = Router();

// Public routes
router.get("/", optionalAuth, getAllTestimonials);
router.get("/approved", optionalAuth, getApprovedTestimonials);
router.get("/videos", optionalAuth, getVideoTestimonials);
router.get("/categories", optionalAuth, getTestimonialCategories);
router.post("/", optionalAuth, uploadImage.single("image"), submitTestimonial);

// Admin routes - ADDED /admin PREFIX
router.get("/admin/all", auth, moderatorCheck, getAllTestimonialsAdmin);
router.post(
  "/admin/create",
  auth,
  moderatorCheck,
  uploadImage.single("image"),
  createTestimonial,
);
router.put(
  "/admin/update/:id",
  auth,
  moderatorCheck,
  uploadImage.single("image"),
  updateTestimonial,
);
router.delete("/admin/delete/:id", auth, moderatorCheck, deleteTestimonial);
router.get("/admin/stats", auth, moderatorCheck, getTestimonialStats);

export default router;
