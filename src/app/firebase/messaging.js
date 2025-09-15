// src/app/firebase/messaging.js
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

/* Même config que dans le SW (et que dans ton firebase-config.ts) */
const firebaseConfig = {
apiKey: "AIzaSyBjyN4XJDyFvt-QUd1BESDepOJqw1X1lxk",
authDomain: "monfrigo-3ae11.firebaseapp.com",
projectId: "monfrigo-3ae11",
storageBucket: "monfrigo-3ae11.appspot.com",
messagingSenderId: "1045422730422",
appId: "1:1045422730422:web:5e66f2268869f842d30a17",
};

const app = initializeApp(firebaseConfig);

/* Messaging peut être indisponible (ex: Safari sans PWA). On garde un guard. */
const messagingPromise = isSupported().then((ok) => (ok ? getMessaging(app) : null));

/** Demande la permission + récupère le token FCM (avec la VAPID key) */
export async function requestFcmToken() {
const messaging = await messagingPromise;
if (!messaging) {
console.warn("FCM non supporté par ce navigateur.");
return null;
}

// important: utiliser le SW déjà prêt
const registration = await navigator.serviceWorker.ready;

const token = await getToken(messaging, {
vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY, // ⚠️ à définir dans .env
serviceWorkerRegistration: registration,
});

console.log("FCM token:", token);
// TODO : si tu veux lier à un compte, envoie-le à ton API ici.
return token;
}

/** Ecoute les messages quand l’onglet est ouvert (foreground) */
export function onForegroundMessage(cb) {
messagingPromise.then((messaging) => {
if (!messaging) return;
onMessage(messaging, (payload) => cb(payload));
});
}
