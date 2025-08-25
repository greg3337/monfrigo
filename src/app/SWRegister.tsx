"use client";

import { useEffect } from "react";
import { requestForToken, onForegroundMessage } from "./firebase/messaging";

export default function SWRegister() {
// 1) Enregistrer le Service Worker (public/firebase-messaging-sw.js)
useEffect(() => {
if ("serviceWorker" in navigator) {
navigator.serviceWorker
.register("/firebase-messaging-sw.js")
.then(() => console.log("[SW] firebase-messaging-sw.js enregistré"))
.catch((err) => console.warn("[SW] échec d’enregistrement :", err));
}
}, []);

// 2) Demander le token FCM + écouter les notifs en premier plan
useEffect(() => {
(async () => {
const token = await requestForToken();
if (token) {
console.log("[FCM] Token :", token);
// TODO: si tu veux, envoie ce token dans Firestore pour l’utilisateur courant
} else {
console.log("[FCM] Pas de token (permissions refusées ?)");
}
})();

// Afficher une notif quand l’app est ouverte (optionnel)
onForegroundMessage((payload) => {
const { title, body, icon } = payload?.notification || {};
if (typeof window !== "undefined" && "Notification" in window) {
if (Notification.permission === "granted") {
new Notification(title || "Mon Frigo", {
body: body || "Nouvelle notification",
icon: icon || "/favicon.ico",
});
}
}
console.log("[FCM] Message foreground :", payload);
});
}, []);

return null;
}

