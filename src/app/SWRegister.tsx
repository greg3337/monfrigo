"use client";

import { useEffect } from "react";
import {requestFcmToken,onForegroundMessage,} from "./firebase/messaging.js"; 

// Petit type minimal pour éviter le "no-explicit-any"
type FcmPayload = {
notification?: {
title?: string;
body?: string;
};
};

export default function SWRegister() {
useEffect(() => {
// 1) Enregistrer le Service Worker
if (typeof window === "undefined") return;
if (!("serviceWorker" in navigator)) return;

navigator.serviceWorker
.register("/firebase-messaging-sw.js")
.catch((err) => console.warn("SW registration failed:", err));

// 2) Demander la permission + écouter les messages en foreground
let unsubscribe: (() => void) | undefined;

(async () => {
try {
await requestFcmToken(); // permission + token + save Firestore

// ⚡ Cast en fonction de cleanup pour corriger l'erreur TS
unsubscribe = (onForegroundMessage((payload: FcmPayload) => {
const title =
payload?.notification?.title ?? "Mon Frigo 🔔 Rappel";
const body =
payload?.notification?.body ?? "Un produit arrive à expiration.";

if (
typeof Notification !== "undefined" &&
Notification.permission === "granted"
) {
new Notification(title, {
body,
icon: "/favicon.ico",
});
}
}) as unknown as () => void);
} catch (e) {
console.warn("FCM init error:", e);
}
})();

// 3) Nettoyage à la sortie
return () => {
if (unsubscribe) unsubscribe();
};
}, []);

return null;
}
