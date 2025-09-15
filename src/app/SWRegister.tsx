"use client";
import { useEffect, useRef } from "react";
import { requestFcmToken, subscribeForeground } from "./firebase/messaging.js";

type FcmPayload = {
notification?: { title?: string; body?: string; icon?: string };
data?: { url?: string };
};

export default function SWRegister() {
const unsubscribeRef = useRef<null | (() => void)>(null);

// 1) Enregistrer le service worker
useEffect(() => {
if (typeof window === "undefined") return;
if (!("serviceWorker" in navigator)) return;

navigator.serviceWorker
.register("/firebase-messaging-sw.js")
.catch((err) => console.warn("SW registration failed:", err));
}, []);

// 2) Demander la permission + écouter en foreground
useEffect(() => {
let mounted = true;

(async () => {
try {
await requestFcmToken(); // permission + token
if (!mounted) return;

const unsub = await subscribeForeground((payload: FcmPayload) => {
const title = payload?.notification?.title ?? "Mon Frigo 🔔 Rappel";
const body = payload?.notification?.body ?? "Un produit arrive à expiration.";
const url = payload?.data?.url ?? "/fridge";

if (typeof Notification !== "undefined" && Notification.permission === "granted") {
new Notification(title, { body, icon: "/favicon.ico", data: { url } });
}
});

unsubscribeRef.current = unsub;
} catch (e) {
console.warn("FCM init error:", e);
}
})();

return () => {
mounted = false;
if (unsubscribeRef.current) unsubscribeRef.current();
};
}, []);

return null;
}
