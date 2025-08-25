import { isSupported, getMessaging, getToken, onMessage } from "firebase/messaging";
import { doc, setDoc, arrayUnion } from "firebase/firestore";
import { auth, db, app } from "./firebase-config";

export async function requestFcmToken() {
try {
if (typeof window === "undefined") return null;
const supported = await isSupported().catch(() => false);
if (!supported) return null;

// Permission navigateur
let permission = (typeof Notification !== "undefined" && Notification.permission) || "default";
if (permission === "default" && typeof Notification !== "undefined") {
permission = await Notification.requestPermission();
}
if (permission !== "granted") return null;

// Enregistrer le Service Worker (au cas où)
const swReg = await navigator.serviceWorker
.register("/firebase-messaging-sw.js")
.catch((e) => {
console.warn("SW register in messaging.js failed:", e);
return undefined;
});

const messaging = getMessaging(app);
const token = await getToken(messaging, {
vapidKey: process.env.NEXT_PUBLIC_FCM_VAPID_KEY,
serviceWorkerRegistration: swReg,
}).catch((e) => {
console.warn("getToken error:", e);
return null;
});

// Sauver le token dans Firestore (si connecté)
const user = auth.currentUser;
if (token && user) {
const userRef = doc(db, "users", user.uid);
await setDoc(userRef, { fcmTokens: arrayUnion(token) }, { merge: true }).catch((e) =>
console.warn("save token error:", e)
);
}

return token || null;
} catch (e) {
console.warn("requestFcmToken error:", e);
return null;
}
}

export function onForegroundMessage(callback) {
if (typeof window === "undefined") return () => {};
let unsub = () => {};

isSupported()
.then((ok) => {
if (!ok) return;
const messaging = getMessaging(app);
unsub = onMessage(messaging, (payload) => {
try {
if (typeof callback === "function") callback(payload);
} catch (e) {
console.warn("callback FCM error:", e);
}
});
})
.catch((e) => console.warn("isSupported() error:", e));

return () => {
try {
unsub && unsub();
} catch (e) {
console.warn("unsub FCM error:", e);
}
};
}
