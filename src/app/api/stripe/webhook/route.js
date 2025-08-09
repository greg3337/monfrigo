import Stripe from "stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // important pour lire le raw body dans l'App Router

export async function POST(req) {
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const sig = req.headers.get("stripe-signature");
const rawBody = await req.text();

let event;
try {
event = stripe.webhooks.constructEvent(
rawBody,
sig,
process.env.STRIPE_WEBHOOK_SECRET // whsec_...
);
} catch (err) {
console.error("[WEBHOOK] Signature invalide:", err.message);
return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
}

// Traite les events utiles
switch (event.type) {
case "checkout.session.completed": {
const session = event.data.object;
console.log("✅ checkout.session.completed", session.id);
// TODO: mise à jour Firestore ici (isSubscribed: true)
break;
}
default:
console.log("ℹ️ Event non géré:", event.type);
}

return NextResponse.json({ received: true });
}
