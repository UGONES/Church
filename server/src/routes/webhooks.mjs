import { Router, raw } from "express";
import { handleStripeWebhook } from "../controllers/webhookController.mjs";
const router = Router();

// Stripe webhook endpoint
router.post("/stripe", raw({ type: "application/json" }), handleStripeWebhook);

export default router;
