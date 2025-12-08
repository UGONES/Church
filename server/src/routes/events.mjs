import { Router } from "express";
import {
  getAllEvents,
  getUpcomingEvents,
  getUserRsvps,
  getUserFavorites,
  rsvpForEvent,
  cancelRsvp,
  addFavoriteEvent,
  removeFavoriteEvent,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/eventController.mjs";
import { auth, optionalAuth } from "../middleware/auth.mjs";
import { moderatorCheck, adminCheck } from "../middleware/adminCheck.mjs";
import { uploadImage } from "../middleware/upload.mjs";
const router = Router();

// Public routes
router.get("/", getAllEvents);
router.get("/upcoming", getUpcomingEvents);

// Authenticated routes
router.get("/user/rsvps", auth, getUserRsvps);
router.get("/user/favorites", auth, getUserFavorites);
router.post("/:id/rsvp", auth, rsvpForEvent);
router.delete("/:id/rsvp", auth, cancelRsvp);
router.post("/:id/favorite", auth, addFavoriteEvent);
router.delete("/:id/favorite", auth, removeFavoriteEvent);

// Admin routes - ADDED /admin PREFIX
router.post('/admin/create', auth, moderatorCheck, handleMediaUpload, createEvent);
router.put('/admin/update/:id', auth, moderatorCheck, handleMediaUpload, updateEvent);
router.delete('/admin/delete/:id', auth, adminCheck, deleteEvent);

export default router;
