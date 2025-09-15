"use client";

import { getToken, onMessage } from "firebase/messaging";
import { messagingPromise } from "../lib/firebaseClient";

// 1) Récupérer le token FCM (jeton unique de l’appareil)
export async function requestFcmToken() {
try {
const messaging = await messagingPromise;
if (!messaging) return null;

const token = await getToken(messaging, {
vapidKey: process.env.NEXT_PUBLIC_FCM_VAPID_KEY,
});

console.log("✅ FCM Token:", token); // S’affiche uniquement dans la console dev
return token;
} catch (err) {
console.error("❌ Erreur lors de la récupération du token FCM", err);
return null;
}
}

// 2) Écouter les notifications quand l’app est ouverte (foreground)
export async function subscribeForeground(cb) {
const messaging = await messagingPromise;
if (!messaging) return () => {};
return onMessage(messaging, cb);
}
