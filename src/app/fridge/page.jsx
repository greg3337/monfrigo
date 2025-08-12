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
deleteDoc, // 👈 ajouté pour la suppression
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

// Suppression d'un produit
const handleDelete = async (productId) => {
if (!user) return;
const confirmDelete = window.confirm("Voulez-vous vraiment supprimer ce produit ?");
if (!confirmDelete) return;

try {
await deleteDoc(doc(db, "users", user.uid, "fridge", productId));
console.log("Produit supprimé :", productId);
} catch (error) {
console.error("Erreur lors de la suppression :", error);
}
};

// Petites métriques
const total = products.length;
const urgent = 0;
const expired = 0;

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
<button
className="deleteBtn"
onClick={() => handleDelete(p.id)}
>
❌ Supprimer
</button>
</li>
))}
</ul>
)}
</section>

{/* Modal d’ajout */}
{isModalOpen && (
<AddProductModal onClose={() => setIsModalOpen(false)} user={user} />
)}
</div>
);
}
