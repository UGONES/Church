// routes/userRoutes.mjs
import { Router } from "express";
import {
  getCurrentUser,
  updateProfile,
  getFamily,
  addFamilyMember,
  trackLoginActivity,
  removeFamilyMember,
  getUserDashboard,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserRoles,
  getMembershipStatuses,
  getUserRSVPs,
  getUserFavorites,
  getUserDonations,
  getUserVolunteers,
  getUserPrayers,
  getPendingVolunteers,
  moderatePrayer,
  moderateBlog,
  uploadAvatar,
  uploadCoverPhoto
} from "../controllers/userController.mjs";

import { uploadImage } from "../middleware/upload.mjs";
import { auth } from "../middleware/auth.mjs";
import { adminCheck, moderatorCheck } from "../middleware/adminCheck.mjs";

const router = Router();

// Middleware wrapper to safely call trackLoginActivity(userId)
const trackLoginMiddleware = async (req, res, next) => {
  try {
    if (req.user && req.user._id) {
      // trackLoginActivity returns updated user — we just fire & forget here
      await trackLoginActivity(req.user._id);
    }
  } catch (err) {
    console.warn("trackLoginActivity error:", err?.message || err);
  }
  next();
};

/* ---------------------------------------
   Public / Authenticated user routes
   (mounted at /api/users or whatever you choose)
   --------------------------------------- */
router.get("/me", auth, trackLoginMiddleware, getCurrentUser);
router.get("/profile", auth, getCurrentUser);
router.put("/profile/update", auth, updateProfile);
router.post("/upload-avatar", auth, uploadImage.single("avatar"), uploadAvatar);
router.post("/upload-cover", auth, uploadImage.single("coverPhoto"), uploadCoverPhoto);

router.get("/family", auth, getFamily);
router.post("/family", auth, addFamilyMember);
router.delete("/family/:memberId", auth, removeFamilyMember);

router.get("/dashboard", auth, getUserDashboard);

/* User supporting endpoints used by Profile / RSVPs pages */
router.get("/rsvps", auth, getUserRSVPs);
router.get("/favorites", auth, getUserFavorites);
router.get("/donations", auth, getUserDonations);
router.get("/volunteers/applications", auth, getUserVolunteers);
router.get("/prayers", auth, getUserPrayers);

/* ---------------------------------------
   Admin routes (adminCheck only)
   --------------------------------------- */
router.get("/admin", auth, adminCheck, getAllUsers); // list users (admin)
router.post("/admin/create", auth, adminCheck, createUser);
router.put("/admin/update/:id", auth, adminCheck, updateUser);
router.delete("/admin/delete/:id", auth, adminCheck, deleteUser);
router.get("/admin/roles", auth, adminCheck, getUserRoles);
router.get("/admin/membership-statuses", auth, adminCheck, getMembershipStatuses);

/* ---------------------------------------
   Moderator endpoints (moderatorCheck)
   --------------------------------------- */
router.get("/moderator/pending-volunteers", auth, moderatorCheck, getPendingVolunteers);
router.patch("/moderator/prayers/:id", auth, moderatorCheck, moderatePrayer);
router.patch("/moderator/blogs/:id", auth, moderatorCheck, moderateBlog);

export default router;
