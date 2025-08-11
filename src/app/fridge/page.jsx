"use client";

import React, { useEffect, useState } from "react";
import AddProductModal from "./AddProductModal";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase/firebase-config";
import {
collection,
doc,
getDoc,
onSnapshot,
orderBy,
query,
} from "firebase/firestore";

export default function FridgePage() {
// Auth + user doc
const [user, setUser] = useState(null);
const [userDoc, setUserDoc] = useState(null);
const [loading, setLoading] = useState(true);

// UI / données
const [isModalOpen, setIsModalOpen] = useState(false);
const [products, setProducts] = useState([]);

// Abonnement à l’auth + chargement du doc utilisateur
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
const ref = doc(db, "users", u.uid);
const snap = await getDoc(ref);
setUserDoc(snap.exists() ? snap.data() : null);
} catch (e) {
console.error("[FRIDGE] Erreur doc user:", e);
} finally {
setLoading(false);
}
});

return () => unsub();
}, []);

// Écoute des produits de l’utilisateur
useEffect(() => {
if (!user) return;

const q = query(
collection(db, "users", user.uid, "fridge"),
orderBy("createdAt", "desc")
);

const unsub = onSnapshot(
q,
(snap) => {
const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
setProducts(list);
},
(err) => console.error("[FRIDGE] onSnapshot produits:", err)
);

return () => unsub();
}, [user]);

// Petites métriques (simple pour l’instant)
const total = products.length;
const urgent = 0; // tu pourras calculer selon une date d’expiration
const expired = 0; // idem

if (loading) {
return (
<div style={{ padding: 24, fontFamily: "system-ui" }}>Chargement…</div>
);
}

return (
<div className="wrap">
{/* Header */}
<header className="header">
<div className="brand">
<div className="logo">🧊</div>
<div>
<div className="brandTitle">Mon Frigo</div>
<div className="brandSub">
Salut {userDoc?.firstName || "!"} 👋
</div>
</div>
</div>

<button className="ghostBtn" onClick={() => setIsModalOpen(true)}>
+ Ajouter un produit
</button>
</header>

{/* Stats */}
<section className="stats">
<div className="card green">
<div className="cardValue">{total}</div>
<div className="cardLabel">Total</div>
</div>
<div className="card orange">
<div className="cardValue">{urgent}</div>
<div className="cardLabel">Urgent</div>
</div>
<div className="card red">
<div className="cardValue">{expired}</div>
<div className="cardLabel">Expirés</div>
</div>
</section>

{/* Barre d’actions */}
<section className="actions">
<input
className="search"
placeholder="Rechercher un produit…"
// TODO: brancher la recherche
/>
<div className="filters">
<select defaultValue="">
<option value="">Toutes les catégories</option>
</select>
<select defaultValue="">
<option value="">Tous les lieux</option>
</select>
</div>
<button className="primary" onClick={() => setIsModalOpen(true)}>
+ Ajouter un produit
</button>
</section>

{/* Liste / état vide */}
<section className="content">
{products.length === 0 ? (
<div className="empty">
<div className="emptyIcon">📦</div>
<div className="emptyTitle">Votre frigo est vide</div>
<div className="emptyText">
Commencez par ajouter vos premiers produits.
</div>
<div className="tip">
Astuce : ajoutez les dates d’expiration pour recevoir des alertes
intelligentes.
</div>
</div>
) : (
<ul className="grid">
{products.map((p) => (
<li key={p.id} className="item">
<div className="itemHead">
<div className="itemName">{p.name || "Sans nom"}</div>
{p.category && <div className="pill">{p.category}</div>}
</div>
{p.expiryDate && (
<div className="muted">DLUO : {p.expiryDate}</div>
)}
{p.place && <div className="muted">Lieu : {p.place}</div>}
</li>
))}
</ul>
)}
</section>

{/* Modal d’ajout */}
{isModalOpen && (
<AddProductModal onClose={() => setIsModalOpen(false)} user={user} />
)}

{/* Styles */}
<style jsx>{`
.wrap {
--bg: #f6f7fb;
--panel: #ffffff;
--text: #0f172a;
--muted: #6b7280;
--border: #e5e7eb;
--green: #10b981;
--orange: #f59e0b;
--red: #ef4444;
min-height: 100dvh;
background: radial-gradient(1200px 600px at 20% -10%, #e8efff 0, #f6f7fb 60%, #f6f7fb 100%);
color: var(--text);
font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
}

.header {
max-width: 1100px;
margin: 24px auto 8px;
padding: 16px 20px;
display: flex;
align-items: center;
justify-content: space-between;
}

.brand {
display: flex;
gap: 12px;
align-items: center;
}
.logo {
width: 36px;
height: 36px;
display: grid;
place-items: center;
border-radius: 10px;
background: #e8f2ff;
}
.brandTitle {
font-weight: 700;
}
.brandSub {
font-size: 13px;
color: var(--muted);
}

.stats {
max-width: 1100px;
margin: 0 auto;
padding: 0 20px;
display: grid;
grid-template-columns: repeat(3, 1fr);
gap: 12px;
}
.card {
background: var(--panel);
border: 1px solid var(--border);
border-radius: 14px;
padding: 16px;
}
.cardValue {
font-size: 28px;
font-weight: 800;
line-height: 1;
}
.cardLabel {
margin-top: 6px;
color: var(--muted);
font-size: 13px;
}
.card.green .cardValue {
color: var(--green);
}
.card.orange .cardValue {
color: var(--orange);
}
.card.red .cardValue {
color: var(--red);
}

.actions {
max-width: 1100px;
margin: 16px auto;
padding: 0 20px;
display: grid;
grid-template-columns: 1fr auto auto;
gap: 10px;
}
.search {
background: var(--panel);
border: 1px solid var(--border);
border-radius: 12px;
padding: 12px 14px;
outline: none;
}
.filters {
display: flex;
gap: 8px;
}
select {
background: var(--panel);
border: 1px solid var(--border);
border-radius: 12px;
padding: 12px 14px;
outline: none;
}
.primary {
background: #2563eb;
color: #fff;
border: none;
border-radius: 12px;
padding: 12px 16px;
cursor: pointer;
}
.ghostBtn {
background: transparent;
border: 1px solid var(--border);
border-radius: 12px;
padding: 10px 14px;
cursor: pointer;
}

.content {
max-width: 1100px;
margin: 8px auto 40px;
padding: 0 20px 20px;
}

.empty {
background: var(--panel);
border: 1px solid var(--border);
border-radius: 16px;
padding: 28px;
display: grid;
place-items: center;
text-align: center;
color: var(--muted);
}
.emptyIcon {
font-size: 34px;
margin-bottom: 8px;
}
.emptyTitle {
color: var(--text);
font-weight: 700;
margin-bottom: 6px;
}
.tip {
margin-top: 10px;
font-size: 13px;
background: #fff8e1;
border: 1px solid #fde68a;
color: #92400e;
padding: 8px 12px;
border-radius: 10px;
}

.grid {
list-style: none;
margin: 0;
padding: 0;
display: grid;
grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
gap: 12px;
}
.item {
background: var(--panel);
border: 1px solid var(--border);
border-radius: 14px;
padding: 14px;
}
.itemHead {
display: flex;
align-items: center;
justify-content: space-between;
gap: 8px;
}
.itemName {
font-weight: 700;
}
.pill {
font-size: 12px;
background: #eef2ff;
color: #3730a3;
border: 1px solid #c7d2fe;
padding: 4px 8px;
border-radius: 999px;
white-space: nowrap;
}
.muted {
margin-top: 6px;
color: var(--muted);
font-size: 13px;
}

@media (max-width: 720px) {
.actions {
grid-template-columns: 1fr;
}
}
`}</style>
</div>
);
}
