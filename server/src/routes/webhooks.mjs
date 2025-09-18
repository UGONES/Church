import { Router, raw } from 'express';
const router = Router();
import { handleStripeWebhook } from '../controllers/webhookController.mjs';

// Stripe webhook endpoint
router.post('/stripe', raw({ type: 'application/json' }), handleStripeWebhook);

export default router;