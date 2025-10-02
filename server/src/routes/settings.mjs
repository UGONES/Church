import { Router } from "express";
import {
  getSettings,
  updateSettings,
  resetSettings,
} from "../controllers/settingController.mjs";
import { auth } from "../middleware/auth.mjs";
import { adminCheck } from "../middleware/adminCheck.mjs";
const router = Router();

// Public route
router.get("/", getSettings);

// Admin routes
router.put("/update", auth, adminCheck, updateSettings);
router.post("/reset", auth, adminCheck, resetSettings);

export default router;
