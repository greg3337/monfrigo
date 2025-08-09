import Stripe from 'stripe';
import { buffer } from 'micro';

export const config = {
api: {
bodyParser: false, // Important pour Stripe
},
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
if (req.method !== 'POST') {
return res.status(405).send('Method Not Allowed');
}

const buf = await buffer(req);
const sig = req.headers['stripe-signature'];

let event;

try {
event = stripe.webhooks.constructEvent(
buf,
sig,
process.env.STRIPE_WEBHOOK_SECRET
);
} catch (err) {
console.error('❌ Erreur de vérification webhook Stripe:', err.message);
return res.status(400).send(`Webhook Error: ${err.message}`);
}

// 📌 Ici, on gère les événements Stripe
if (event.type === 'checkout.session.completed') {
console.log('✅ Paiement réussi :', event.data.object);
}

res.json({ received: true });
}
