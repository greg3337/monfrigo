'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import AddProductModal from './AddProductModal.jsx';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase/firebase-config';
import {collection,deleteDoc,doc,getDoc,onSnapshot,orderBy,query,} from 'firebase/firestore';
import '../styles/tabbar.css';
import { requestFcmToken, onForegroundFcm } from "../firebase/messaging";
import { doc, setDoc, arrayUnion } from "firebase/firestore";


export default function FridgePage() {
// Auth + user doc
const [user, setUser] = useState(null);
const [userDoc, setUserDoc] = useState(null);
const [loading, setLoading] = useState(true);

// Données
const [products, setProducts] = useState([]);

// UI
const [isModalOpen, setIsModalOpen] = useState(false);
const [q, setQ] = useState('');
const [category, setCategory] = useState('all');
const [place, setPlace] = useState('all');

const pathname = usePathname();

// Auth + chargement Firestore
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
const userRef = doc(db, 'users', u.uid);
const snap = await getDoc(userRef);
if (snap.exists()) setUserDoc(snap.data());

const qRef = query(
collection(db, 'users', u.uid, 'products'),
orderBy('expirationDate')
);
onSnapshot(qRef, (s) => {
const list = s.docs.map((d) => ({ id: d.id, ...d.data() }));
setProducts(list);
});
} catch (e) {
console.error('Firestore error:', e);
} finally {
setLoading(false);
}
});
return () => unsub();
}, []);

// --- Notifications push Web (FCM) ---
useEffect(() => {
if (typeof window === "undefined") return;
if (!("Notification" in window)) return;
if (!user) return;

let cancelled = false;

(async () => {
try {
let permission = Notification.permission;
if (permission === "default") {
permission = await Notification.requestPermission();
}
if (permission !== "granted" || cancelled) return;

const swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

const token = await getToken(undefined, {
vapidKey: process.env.NEXT_PUBLIC_FCM_VAPID_KEY,
serviceWorkerRegistration: swReg,
});

if (!token || cancelled) return;

const userRef = doc(db, "users", user.uid);
await setDoc(userRef, { fcmTokens: arrayUnion(token) }, { merge: true });

const unsubOnMessage = onMessage((payload) => {
const title = payload?.notification?.title || "Mon Frigo – Rappel";
const body = payload?.notification?.body || "Un produit arrive à expiration.";
if (Notification.permission === "granted") {
new Notification(title, { body, icon: "/favicon.ico" });
}
});

return () => {
cancelled = true;
unsubOnMessage?.();
};
} catch (err) {
console.warn("FCM error", err);
}
})();

return () => {
cancelled = true;
};
}, [user]);


// Suppression
const deleteProduct = async (id) => {
if (!user) return;
await deleteDoc(doc(db, 'users', user.uid, 'products', id));
};

// Filtrage affiché
const visible = useMemo(() => {
return products.filter((p) => {
const okQ = q === '' || (p.name || '').toLowerCase().includes(q.toLowerCase());
const okCat = category === 'all' || (p.category || 'autre') === category;
const okPlace = place === 'all' || (p.place || 'frigo') === place;
return okQ && okCat && okPlace;
});
}, [products, q, category, place]);

// Compteurs
const total = products.length;
const urgent = products.filter((p) => p.status === 'urgent').length;
const expired = products.filter((p) => p.status === 'expired' || p.status === 'expiré').length;

// Nom convivial pour le header (Auth > Firestore > vide)
const greetingName =
(typeof user?.displayName === 'string' && user.displayName.trim()) ||
(typeof userDoc?.name === 'string' && userDoc.name.trim()) ||
'';

if (loading) return <p>Chargement...</p>;

return (
<div className="wrap">
{/* Header */}
<div className="header">
<div className="brand">
<div className="brandTitle">Mon Frigo</div>
<div className="brandSub">
{`Salut${greetingName ? ' ' + greetingName : ''} 👋`}
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
placeholder="Rechercher un produit..."
value={q}
onChange={(e) => setQ(e.target.value)}
/>
<div className="filters">
<select value={category} onChange={(e) => setCategory(e.target.value)}>
<option value="all">Toutes les catégories</option>
<option value="viande">Viande</option>
<option value="poisson">Poisson</option>
<option value="légume">Légume</option>
<option value="fruit">Fruit</option>
<option value="laitier">Laitier</option>
<option value="autre">Autre</option>
</select>
<select value={place} onChange={(e) => setPlace(e.target.value)}>
<option value="all">Tous les lieux</option>
<option value="frigo">Frigo</option>
<option value="congélo">Congélo</option>
<option value="placard">Placard</option>
</select>
</div>
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
{p.expirationDate && <span className="pill">{p.expirationDate}</span>}
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
<div className="emptyIcon">🧺</div>
<div className="emptyTitle">Votre frigo est vide</div>
<div className="emptyText">Ajoutez vos premiers produits pour commencer.</div>
<button className="primary" onClick={() => setIsModalOpen(true)}>
Ajouter un produit
</button>
</div>
)}

{/* Modal d’ajout */}
{isModalOpen && <AddProductModal closeModal={() => setIsModalOpen(false)} />}

{/* Tabbar */}
<nav className="tabbar" role="navigation" aria-label="Navigation principale">
<Link href="/fridge" className={`tab ${pathname.includes('/fridge') ? 'is-active' : ''}`}>
<span className="tab__icon">🧊</span><span className="tab__label">Frigo</span>
</Link>

<Link href="/settings" className={`tab ${pathname.includes('/settings') ? 'is-active' : ''}`}>
<span className="tab__icon">⚙️</span><span className="tab__label">Paramètres</span>
</Link>
</nav>
</div>
);
}
