"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import AddProductModal from "./AddProductModal.jsx";

// Auth + config Firebase
import { onAuthStateChanged } from "firebase/auth";
import { auth, db, app } from "../firebase/firebase-config";

// Firestore
import {collection,deleteDoc,doc,getDoc,onSnapshot,orderBy,query,setDoc,arrayUnion,} from "firebase/firestore";

// FCM (Web push)
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

// Style onglets bas
import "../styles/tabbar.css";

export default function FridgePage() {
// --- Auth + doc user ---
const [user, setUser] = useState(null);
const [userDoc, setUserDoc] = useState(null);
const [loading, setLoading] = useState(true);

// --- Données produits ---
const [products, setProducts] = useState([]);

// --- UI ---
const [isModalOpen, setIsModalOpen] = useState(false);
const [q, setQ] = useState("");
const [category, setCategory] = useState("all");
const [place, setPlace] = useState("all");

const pathname = usePathname();

// ========== 1) Chargement Auth + Firestore ==========
useEffect(() => {
const unsub = onAuthStateChanged(auth, async (u) => {
setUser(u || null);

if (!u) {
setUserDoc(null);
setProducts([]);
setLoading(false);
return;
}

try {
// doc utilisateur
const userRef = doc(db, "users", u.uid);
const snap = await getDoc(userRef);
if (snap.exists()) setUserDoc(snap.data());

// collection produits ordonnée par expiration
const qRef = query(
collection(db, "users", u.uid, "products"),
orderBy("expirationDate")
);

const off = onSnapshot(qRef, (s) => {
const list = s.docs.map((d) => ({ id: d.id, ...d.data() }));
setProducts(list);
});

setLoading(false);
return () => off();
} catch (e) {
console.error("Firestore error:", e);
setLoading(false);
}
});

return () => unsub();
}, []);

// ========== 2) Notifications push Web (FCM) ==========
useEffect(() => {
(async () => {
try {
if (typeof window === "undefined") return;
if (!user) return;

// FCM support ?
const supported = await isSupported().catch(() => false);
if (!supported) return;

// Permission
if (!("Notification" in window)) return;
let permission = Notification.permission;
if (permission === "default") {
permission = await Notification.requestPermission();
}
if (permission !== "granted") return;

// Enregistrer le service worker (doit être SERVI depuis /public)
const swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

// Récupérer un token FCM
const messaging = getMessaging(app);
const token = await getToken(messaging, {
vapidKey: process.env.NEXT_PUBLIC_FCM_VAPID_KEY,
serviceWorkerRegistration: swReg,
});
if (!token) return;

// Stocker le token côté user (pour envoi futur de push)
const userRef = doc(db, "users", user.uid);
await setDoc(userRef, { fcmTokens: arrayUnion(token) }, { merge: true });

// Écoute des messages quand l’app est AU PREMIER PLAN
const offMessage = onMessage(messaging, (payload) => {
const title = payload?.notification?.title || "Mon Frigo 🥶 Rappel";
const body =
payload?.notification?.body || "Un produit arrive à expiration.";

// Petite notif locale (facultative — le SW gère déjà les notifs en bg)
if (Notification.permission === "granted") {
new Notification(title, { body, icon: "/favicon.ico" });
}
});

return () => offMessage();
} catch (err) {
console.warn("FCM error:", err);
}
})();
}, [user]);

// ========== Actions ==========
const deleteProduct = async (id) => {
if (!user) return;
await deleteDoc(doc(db, "users", user.uid, "products", id));
};

// ========== Sélecteur d’affichage ==========
const visible = useMemo(() => {
return products.filter((p) => {
const okQ =
q.trim() === "" ||
(p?.name || "").toString().toLowerCase().includes(q.toLowerCase());
const okCat = category === "all" || (p?.category || "autre") === category;
const okPlace = place === "all" || (p?.place || "frigo") === place;
return okQ && okCat && okPlace;
});
}, [products, q, category, place]);

// ========== Compteurs ==========
const total = products.length;
const urgent = products.filter((p) => p.status === "urgent").length;
const expired = products.filter((p) => p.status === "expiré" || p.status === "expire").length;

// Nom affiché (Auth > Firestore > fallback)
const greetingName =
(typeof user?.displayName === "string" && user.displayName.trim()) ||
(typeof userDoc?.name === "string" && userDoc.name.trim()) ||
"";

if (loading) return <p>Chargement…</p>;

return (
<div className="wrap">
{/* Header */}
<div className="header">
<div className="brand">
<div className="brandTitle">Mon Frigo</div>
<div className="brandSub">
Salut{greetingName ? `, ${greetingName}` : ""} 👋
</div>
</div>
</div>

{/* Cartes stats */}
<div className="stats">
<div className="card green">
<div className="cardLabel">Total</div>
<div className="cardValue">{total}</div>
</div>
<div className="card orange">
<div className="cardLabel">Urgent</div>
<div className="cardValue">{urgent}</div>
</div>
<div className="card red">
<div className="cardLabel">Expirés</div>
<div className="cardValue">{expired}</div>
</div>
</div>

{/* Barre d’actions */}
<div className="actions">
<input
className="search"
placeholder="Rechercher un produit…"
value={q}
onChange={(e) => setQ(e.target.value)}
/>
<select value={category} onChange={(e) => setCategory(e.target.value)}>
<option value="all">Toutes les catégories</option>
<option value="viande">Viande</option>
<option value="poisson">Poisson</option>
<option value="legume">Légume</option>
<option value="laitier">Laitier</option>
<option value="autre">Autre</option>
</select>
<select value={place} onChange={(e) => setPlace(e.target.value)}>
<option value="all">Tous les lieux</option>
<option value="frigo">Frigo</option>
<option value="congelo">Congélateur</option>
<option value="placard">Placard</option>
</select>

<button className="primary" onClick={() => setIsModalOpen(true)}>
+ Ajouter un produit
</button>
</div>

{/* Liste produits */}
<div className="content">
<ul className="grid">
{visible.map((p) => (
<li key={p.id} className="item">
<div className="itemMeta">
<span className="itemName">{p.name}</span>
<span className="pill">{p.expirationDate}</span>
</div>
<button className="deleteBtn" onClick={() => deleteProduct(p.id)}>
Supprimer
</button>
</li>
))}
</ul>
</div>

{/* État vide */}
{products.length === 0 && (
<div className="empty">
<div className="emptyIcon" />
<div className="emptyTitle">Votre frigo est vide</div>
<div className="emptyText">
Ajoutez vos premiers produits pour commencer.
</div>
<button className="primary" onClick={() => setIsModalOpen(true)}>
Ajouter un produit
</button>
</div>
)}

{/* Modal d’ajout */}
{isModalOpen && <AddProductModal closeModal={() => setIsModalOpen(false)} />}

{/* Tabbar */}
<nav className="tabbar" role="navigation" aria-label="navigation principale">
<Link href="/fridge" className={`tab ${pathname.includes("/fridge") ? "is-active" : ""}`}>
<span className="tab__icon">🧊</span>
<span className="tab__label">Frigo</span>
</Link>
<Link href="/settings" className={`tab ${pathname.includes("/settings") ? "is-active" : ""}`}>
<span className="tab__icon">⚙️</span>
<span className="tab__label">Paramètres</span>
</Link>
</nav>
</div>
);
}


