// src/lib/firebaseClient.ts
// "use client" pas nécessaire ici, on protège l'accès window nous-mêmes.
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getMessaging, isSupported, type Messaging } from "firebase/messaging";

const firebaseConfig = {
apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Messaging uniquement dans le navigateur, et seulement si supporté
export const messagingPromise: Promise<Messaging | null> = (async () => {
if (typeof window === "undefined") return null;
if (!(await isSupported())) return null;
try {
return getMessaging(app);
} catch {
return null;
}
})();