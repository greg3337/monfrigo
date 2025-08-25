"use client";

import { useEffect } from "react";
import {
requestFcmToken,
onForegroundMessage,
} from "./firebase/messaging.js"; // <-- .js extension

export default function SWRegister() {
// Enregistrer le Service Worker (une seule fois)
useEffect(() => {
if (typeof window === "undefined") return;
if (!("serviceWorker" in navigator)) return;

navigator.serviceWorker
.register("/firebase-messaging-sw.js")
.catch((err) => console.warn("SW registration failed:", err));
}, []);

// Initialiser FCM + écouter les notifs en foreground
useEffect(() => {
let unsubscribe = () => {};

(async () => {
try {
// Demande la permission + récupère/renvoie le token
await requestFcmToken();

// Ecoute des messages reçus quand l’onglet est ouvert
unsubscribe = onForegroundMessage((payload: any) => {
const title =
payload?.notification?.title || "Mon Frigo 🔔 Rappel";
const body =
payload?.notification?.body ||
"Un produit arrive à expiration.";

if (
typeof Notification !== "undefined" &&
Notification.permission === "granted"
) {
new Notification(title, { body, icon: "/favicon.ico" });
}
});
} catch (e) {
console.warn("FCM init error:", e);
}
})();

return () => {
try {
unsubscribe && unsubscribe();
} catch {}
};
}, []);

return null;
}
