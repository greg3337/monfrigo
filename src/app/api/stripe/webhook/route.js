import Stripe from "stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

export async function POST(req) {
const signature = req.headers.get("stripe-signature");
if (!signature) {
return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
}

const rawBody = await req.text();

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!endpointSecret) {
return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET not set" }, { status: 500 });
}

let event;
try {
event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
} catch (err) {
return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 });
}

switch (event.type) {
case "checkout.session.completed": {
const session = event.data.object;
console.log("✅ checkout.session.completed", session.id);
// TODO: mettre isSubscribed: true en DB ici si tu veux
break;
}
case "invoice.payment_succeeded": {
const invoice = event.data.object;
console.log("💸 invoice.payment_succeeded", invoice.id);
break;
}
case "customer.subscription.deleted": {
const sub = event.data.object;
console.log("🧹 customer.subscription.deleted", sub.id);
// TODO: mettre isSubscribed: false en DB ici si tu veux
break;
}
default:
console.log("ℹ️ Event non géré:", event.type);
}

return NextResponse.json({ received: true });
}
