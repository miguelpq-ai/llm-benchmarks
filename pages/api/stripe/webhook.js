/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events for subscription lifecycle.
 */
import Database from '../../../src/db';

// Disable body parsing — Stripe needs the raw body for signature verification
export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeSecretKey || !webhookSecret) {
    return res.status(500).json({ error: 'Stripe is not configured' });
  }

  const stripe = require('stripe')(stripeSecretKey);
  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const db = new Database();
  await db.init();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const email = session.customer_email || session.customer_details?.email;
        const customerId = session.customer;

        if (email && customerId) {
          const key = await db.createApiKey(email, customerId, 'premium');
          console.log(`API key created for ${email}: ${key.slice(0, 10)}...`);
        }
        break;
      }

      case 'customer.subscription.deleted':
      case 'customer.subscription.paused': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        if (customerId) {
          await db.deactivateApiKeyByStripeCustomer(customerId);
          console.log(`API key deactivated for customer ${customerId}`);
        }
        break;
      }

      default:
        // Unhandled event type — that's OK
        break;
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Stripe webhook handler error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    db.close();
  }
}
