/* public/firebase-messaging-sw.js */
/* Charge les libs compat pour le Service Worker */
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

/* ⚠️ Remplace par TON objet de config, le même que côté client */
firebase.initializeApp({
apiKey: "AIzaSyBjyN4XJDyFvt-QUd1BESDepOJqw1X1lxk",
authDomain: "monfrigo-3ae11.firebaseapp.com",
projectId: "monfrigo-3ae11",
storageBucket: "monfrigo-3ae11.appspot.com",
messagingSenderId: "1045422730422",
appId: "1:1045422730422:web:5e66f2268869f842d30a17",
});

/* Instancie Messaging pour le SW */
const messaging = firebase.messaging();

/* Reçoit les notifications quand l’app est fermée / en arrière-plan */
messaging.onBackgroundMessage((payload) => {
// Essaie de récupérer un titre/texte propre
const n = payload.notification || {};
const title = n.title || "Mon Frigo – Rappel";
const body = n.body || "Un produit arrive à expiration.";
// Possibles champs supplémentaires envoyés depuis ton serveur/console
const icon = n.icon || "/favicon.ico";
const badge = n.badge || "/favicon.ico";
const url = (payload.data && payload.data.url) || "/fridge";

const options = { body, icon, badge, data: { url } };
self.registration.showNotification(title, options);
});

/* Clic sur la notif → ouvre l’URL passée dans data.url */
self.addEventListener("notificationclick", (event) => {
event.notification.close();
const url = (event.notification.data && event.notification.data.url) || "/fridge";
event.waitUntil(
clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
// focus si déjà ouvert
for (const client of windowClients) {
if ("url" in client && client.url.includes(url) && "focus" in client) {
return client.focus();
}
}
// sinon ouvre
if (clients.openWindow) return clients.openWindow(url);
})
);
});

/* Aide à mettre à jour le SW plus vite */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
event.waitUntil(self.clients.claim());
});