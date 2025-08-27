/* /public/firebase-messaging-sw.js */
/* Librairies compat pour le service worker */
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

/* ⚠️ Copie la même config que dans firebase-config.ts */
firebase.initializeApp({
  apiKey: "AIzaSyBjyN4XJDyFvt-QUd1BESDepOJqw1X1lxk",
  authDomain: "monfrigo-3ae11.firebaseapp.com",
  projectId: "monfrigo-3ae11",
  storageBucket: "monfrigo-3ae11.appspot.com",
  messagingSenderId: "1045422730422",
  appId: "1:1045422730422:web:5e66f2268869f842d30a17",
});

/* Notifications reçues quand l’app est fermée ou en arrière-plan */
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const n = payload.notification || {};
  const title = n.title || "Mon Frigo";
  const options = {
    body: n.body || "Nouvelle notification",
    icon: "/file.svg",   
    badge: "/file.svg",
    data: payload.data || {},
  };
  self.registration.showNotification(title, options);
});

/* Clique sur la notification → ouverture de la page */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification?.data && event.notification.data.url) || "/fridge";
  event.waitUntil(clients.openWindow(url));
});
