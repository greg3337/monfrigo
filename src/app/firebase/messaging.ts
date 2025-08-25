"use client";

import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { app } from "./firebase-config"; // <-- on récupère ton app déjà exportée

// Récupération du token FCM pour ce navigateur
export async function requestForToken(): Promise<string | null> {
if (typeof window === "undefined") return null; // sécurité : pas côté serveur

try {
const messagingSupported = await isSupported();
if (!messagingSupported) {
console.warn("Firebase Messaging non supporté dans ce navigateur.");
return null;
}

const messaging = getMessaging(app);

const currentToken = await getToken(messaging, {
vapidKey: process.env.NEXT_PUBLIC_FCM_VAPID_KEY, // ⚡ ajoute ta clé VAPID dans .env.local
});

if (currentToken) {
console.log("Token FCM récupéré :", currentToken);
return currentToken;
} else {
console.warn("Aucun token FCM reçu. L'utilisateur doit peut-être accepter les notifications.");
return null;
}
} catch (error) {
console.error("Erreur lors de la récupération du token FCM :", error);
return null;
}
}

// Réception des notifications quand l'app est ouverte
export function onForegroundMessage(callback: (payload: any) => void) {
if (typeof window !== "undefined") {
const messaging = getMessaging(app);
onMessage(messaging, callback);
}
}
