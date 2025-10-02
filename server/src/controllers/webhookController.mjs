import Stripe from "stripe";
import Donation from "../models/Donation.mjs";
import User from "../models/User.mjs";
import { sendDonationReceipt } from "../utils/emailService.mjs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Handle Stripe webhooks
export async function handleStripeWebhook(req, res) {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event types
  switch (event.type) {
    case "payment_intent.succeeded":
      await handlePaymentIntentSucceeded(event.data.object);
      break;
    case "payment_intent.payment_failed":
      await handlePaymentIntentFailed(event.data.object);
      break;
    case "customer.subscription.created":
      await handleSubscriptionCreated(event.data.object);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
}

// Handle successful payment
const handlePaymentIntentSucceeded = async (paymentIntent) => {
  try {
    const donation = await Donation.findOne({
      stripePaymentIntentId: paymentIntent.id,
    });

    if (donation) {
      donation.status = "completed";
      donation.receiptSent = true;
      donation.receiptSentAt = new Date();
      await donation.save();

      // Send receipt email
      const user = await User.findById(donation.userId);
      if (user) {
        await sendDonationReceipt(user.email, donation);
      }
    }
  } catch (error) {
    console.error("Error handling successful payment:", error);
  }
};

// Handle failed payment
const handlePaymentIntentFailed = async (paymentIntent) => {
  try {
    await Donation.findOneAndUpdate(
      { stripePaymentIntentId: paymentIntent.id },
      { status: "failed" },
    );
  } catch (error) {
    console.error("Error handling failed payment:", error);
  }
};

// Handle subscription created
const handleSubscriptionCreated = async (subscription) => {
  try {
    // Add recurring donation logic here
    console.log("Subscription created:", subscription.id);
  } catch (error) {
    console.error("Error handling subscription creation:", error);
  }
};

// Handle subscription deleted
const handleSubscriptionDeleted = async (subscription) => {
  try {
    // Add cancellation logic here
    console.log("Subscription cancelled:", subscription.id);
  } catch (error) {
    console.error("Error handling subscription cancellation:", error);
  }
};
