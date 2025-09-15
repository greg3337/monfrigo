"use client";

import { getToken, onMessage } from "firebase/messaging";
import { messagingPromise } from "../lib/firebaseClient";

// 1) Récupérer le token FCM (jeton unique de ton appareil)
export async function requestFcmToken() {
try {
const messaging = await messagingPromise;
if (!messaging) return null;

const token = await getToken(messaging, {
vapidKey: process.env.NEXT_PUBLIC_FCM_VAPID_KEY,
});

// ✅ Affiche le token directement sur ton iPhone
alert("📲 Ton FCM Token : " + token);

return token;
} catch (err) {
alert("❌ Erreur lors de la récupération du token FCM : " + err.message);
return null;
}
}

// 2) Écouter les notifications quand l’app est ouverte
export async function subscribeForeground(cb) {
const messaging = await messagingPromise;
if (!messaging) return () => {};
return onMessage(messaging, cb);
}
