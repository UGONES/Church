import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create payment intent
const createPaymentIntent = async (amount, currency = 'usd', metadata = {}) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
      // Add shipping if needed for billing address verification
      shipping: metadata.billingAddress ? {
        address: {
          line1: metadata.billingAddress.line1,
          line2: metadata.billingAddress.line2,
          city: metadata.billingAddress.city,
          state: metadata.billingAddress.state,
          postal_code: metadata.billingAddress.postal_code,
          country: metadata.billingAddress.country,
        },
        name: metadata.name || 'Customer',
      } : undefined,
    });

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Retrieve payment intent
const retrievePaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return {
      success: true,
      paymentIntent
    };
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Create customer
const createCustomer = async (email, name, metadata = {}) => {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata
    });

    return {
      success: true,
      customer
    };
  } catch (error) {
    console.error('Error creating customer:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Create subscription
const createSubscription = async (customerId, priceId, metadata = {}) => {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      metadata,
      expand: ['latest_invoice.payment_intent'],
    });

    return {
      success: true,
      subscription
    };
  } catch (error) {
    console.error('Error creating subscription:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Confirm payment with billing details
const confirmPaymentWithBilling = async (paymentIntentId, billingAddress) => {
  try {
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method_data: {
        billing_details: {
          address: {
            line1: billingAddress.line1,
            line2: billingAddress.line2,
            city: billingAddress.city,
            state: billingAddress.state,
            postal_code: billingAddress.postal_code,
            country: billingAddress.country,
          }
        }
      }
    });

    return {
      success: true,
      paymentIntent
    };
  } catch (error) {
    console.error('Error confirming payment:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  createPaymentIntent,
  retrievePaymentIntent,
  createCustomer,
  createSubscription,
  confirmPaymentWithBilling
};