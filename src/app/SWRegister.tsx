"use client";

import { useEffect, useRef } from "react";
import { requestFcmToken, subscribeForeground } from "./firebase/messaging.js";

type FcmPayload = {
notification?: { title?: string; body?: string; icon?: string };
data?: { url?: string };
};

export default function SWRegister() {
const unsubscribeRef = useRef<() => void>(() => {});

// 1) Enregistrer le service worker
useEffect(() => {
if (typeof window === "undefined") return;
if (!("serviceWorker" in navigator)) return;

navigator.serviceWorker
.register("/firebase-messaging-sw.js")
.catch((err) => console.warn("❌ Service Worker registration failed:", err));
}, []);

// 2) Demander la permission + écouter en foreground
useEffect(() => {
let mounted = true;

(async () => {
try {
// Récupération du token FCM
await requestFcmToken();

if (!mounted) return;

// Écoute des notifications en foreground
const unsub = await subscribeForeground((payload: FcmPayload) => {
const title = payload.notification?.title ?? "Mon Frigo 🔔";
const body = payload.notification?.body ?? "Un produit arrive à expiration.";
const url = payload.data?.url ?? "/fridge";

if (
typeof Notification !== "undefined" &&
Notification.permission === "granted"
) {
new Notification(title, {
body,
icon: "/favicon.ico",
data: { url },
});
}
});

unsubscribeRef.current = unsub;
} catch (e) {
console.warn("⚠️ Erreur init FCM:", e);
}
})();

return () => {
mounted = false;
if (unsubscribeRef.current) unsubscribeRef.current();
};
}, []);

return null;
}
