"use client";
import { getToken, onMessage } from "firebase/messaging";
import { messagingPromise } from "../lib/firebaseClient";

export async function requestFcmToken() {
const messaging = await messagingPromise;
if (!messaging) return null;
return getToken(messaging, {
vapidKey: process.env.NEXT_PUBLIC_FCM_VAPID_KEY,
});
}

// renvoie une fonction d’unsubscribe (ou un no-op si pas de support)
export async function subscribeForeground(cb) {
const messaging = await messagingPromise;
if (!messaging) return () => {};
return onMessage(messaging, cb);
}
