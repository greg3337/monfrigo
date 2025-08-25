"use client";

import { useEffect } from "react";
import {requestFcmToken,onForegroundMessage,} from "./firebase/messaging.js"; // garde bien le .js

// Petit type minimal pour éviter le "no-explicit-any"
type FcmPayload = {
notification?: {
title?: string;
body?: string;
};
};

export default function SWRegister() {
// 1) Enregistrer le Service Worker
useEffect(() => {
if (typeof window === "undefined") return;
if (!("serviceWorker" in navigator)) return;

navigator.serviceWorker
.register("/firebase-messaging-sw.js")
.catch((err) => console.warn("SW registration failed:", err));
}, []);

// 2) Demander la permission + écouter les messages en foreground
useEffect(() => {
let unsubscribe: () => void = () => {};

(async () => {
try {
await requestFcmToken(); // permission + token + save Firestore

unsubscribe = onForegroundMessage((payload: FcmPayload) => {
const title =
payload?.notification?.title ?? "Mon Frigo 🔔 Rappel";
const body =
payload?.notification?.body ??
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
unsubscribe();
} catch {}
};
}, []);

return null;
}
