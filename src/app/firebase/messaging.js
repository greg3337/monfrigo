// ⚠️ FICHIER 100% JS (pas .ts)
// Chemin: src/app/firebase/messaging.js

import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { app } from "../firebase/firebase-config"; // tu as déjà `export const app = initializeApp(...)`

/** Retourne true si on peut utiliser FCM dans ce navigateur. */
async function fcmAvailable() {
try {
return typeof window !== "undefined" && (await isSupported());
} catch {
return false;
}
}

/** Demande la permission si besoin et retourne le token FCM (ou null). */
export async function requestFcmToken() {
if (!(await fcmAvailable())) return null;

// Demande la permission (si pas encore décidée)
try {
if (typeof Notification !== "undefined" && Notification.permission === "default") {
const res = await Notification.requestPermission();
if (res !== "granted") return null;
}
} catch {
// pas bloquant
}

// Récupère le token
try {
const messaging = getMessaging(app);
const vapidKey = process.env.NEXT_PUBLIC_FCM_VAPID_KEY;
if (!vapidKey) {
console.warn("NEXT_PUBLIC_FCM_VAPID_KEY manquant dans les variables d'env.");
return null;
}
const token = await getToken(messaging, { vapidKey });
return token || null;
} catch (e) {
console.warn("Erreur getToken FCM:", e);
return null;
}
}

/**
* Écoute les messages reçus quand l’onglet est OUVERT.
* @param {(payload: any) => void} callback
* @returns {() => void} fonction pour désabonner
*/
export function onForegroundMessage(callback) {
// si FCM indisponible, renvoyer un noop
let unsub = () => {};
(async () => {
if (!(await fcmAvailable())) return;
try {
const messaging = getMessaging(app);
unsub = onMessage(messaging, (payload) => {
try {
if (typeof callback === "function") callback(payload);
} catch (err) {
console.warn("Callback FCM erreur:", err);
}
});
} catch (e) {
console.warn("Erreur onMessage FCM:", e);
}
})();

return () => {
try { unsub && unsub(); } catch {}
};
}
