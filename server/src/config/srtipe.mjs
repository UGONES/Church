const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Webhook handler for Stripe events
const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await handlePaymentIntentSucceeded(paymentIntent);
      break;
    case 'payment_intent.payment_failed':
      const failedPaymentIntent = event.data.object;
      await handlePaymentIntentFailed(failedPaymentIntent);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

// Handle successful payment
const handlePaymentIntentSucceeded = async (paymentIntent) => {
  try {
    const donation = await Donation.findOne({
      stripePaymentIntentId: paymentIntent.id
    });

    if (donation) {
      donation.status = 'completed';
      donation.receiptSent = true;
      donation.receiptSentAt = new Date();
      await donation.save();

      // Send receipt email
      await sendDonationReceipt(donation);
    }
  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
};

// Handle failed payment
const handlePaymentIntentFailed = async (paymentIntent) => {
  try {
    await Donation.findOneAndUpdate(
      { stripePaymentIntentId: paymentIntent.id },
      { status: 'failed' }
    );
  } catch (error) {
    console.error('Error handling failed payment:', error);
  }
};

export default {
  stripe,
  handleStripeWebhook
};