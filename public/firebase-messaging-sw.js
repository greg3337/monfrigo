/* /public/firebase-messaging-sw.js */

/* 1) Charger Firebase (compat) dans le Service Worker */
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

/* 2) Config Firebase — remplace par TES valeurs (les mêmes que côté client) */
firebase.initializeApp({
apiKey: "AIzaSyBjyN4XJDyFvt-QUd1BESDepOJqw1X1lxk",
authDomain: "monfrigo-3ae11.firebaseapp.com",
projectId: "monfrigo-3ae11",
storageBucket: "monfrigo-3ae11.appspot.com",
messagingSenderId: "1045422730422",
appId: "1:1045422730422:web:5e66f2268869f842d30a17",
// pas besoin de vapidKey ici (c’est côté client)
});

/* 3) Instance Messaging */
const messaging = firebase.messaging();

/* 4) Réception des notifications quand l’app est fermée/arrière-plan */
messaging.onBackgroundMessage((payload) => {
const n = payload?.notification || {};
const title = n.title || "Mon Frigo 🔔";
const body = n.body || "Un produit arrive à expiration.";
// lien cliquable prioritaire: data.url → fcmOptions.link → racine
const url =
(payload?.data && payload.data.url) ||
(payload?.fcmOptions && payload.fcmOptions.link) ||
"/fridge";

const options = {
body,
icon: n.icon || "/favicon.ico",
badge: n.badge || "/favicon.ico",
data: { url },
};

self.registration.showNotification(title, options);
});

/* 5) Clic sur la notif → ouvrir/mettre au premier plan un onglet */
self.addEventListener("notificationclick", (event) => {
event.notification.close();
const url = (event.notification?.data && event.notification.data.url) || "/";

event.waitUntil(
(async () => {
const allClients = await clients.matchAll({
type: "window",
includeUncontrolled: true,
});

for (const client of allClients) {
// si un onglet de ton site est déjà ouvert, on le focus
if ("focus" in client && client.url.includes(self.location.origin)) {
return client.focus();
}
}
// sinon on ouvre un nouvel onglet
if (clients.openWindow) return clients.openWindow(url);
})()
);
});
