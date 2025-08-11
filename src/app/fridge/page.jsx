"use client";

import React, { useEffect, useState } from "react";
import AddProductModal from "./AddProductModal";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebase/firebase-config";
import {
collection,
doc,
getDoc,
onSnapshot,
orderBy,
query
} from "firebase/firestore";

export default function FridgePage() {
// Auth + doc utilisateur
const [user, setUser] = useState(null);
const [userDoc, setUserDoc] = useState(null);
const [loading, setLoading] = useState(true);

// UI / données
const [isModalOpen, setIsModalOpen] = useState(false);
const [products, setProducts] = useState([]);

// Auth + chargement doc user
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

// Récupération produits
useEffect(() => {
if (!user) return;
const q = query(
collection(db, "users", user.uid, "products"),
orderBy("createdAt", "desc")
);
const unsub = onSnapshot(q, (snapshot) => {
const items = snapshot.docs.map((doc) => ({
id: doc.id,
...doc.data(),
}));
setProducts(items);
});
return () => unsub();
}, [user]);

if (loading) return <div className="loading">Chargement...</div>;

return (
<div className="fridge-container">
<header className="header">
<div className="brand">
<span role="img" aria-label="box">📦</span>
<h1>Mon Frigo</h1>
</div>
{user && <p>Salut {user.displayName || "utilisateur"} 👋</p>}
</header>

<section className="stats">
<div className="stat green">
<span>{products.length}</span>
<p>Total</p>
</div>
<div className="stat orange">
<span>{products.filter(p => p.isUrgent).length}</span>
<p>Urgent</p>
</div>
<div className="stat red">
<span>{products.filter(p => p.isExpired).length}</span>
<p>Expirés</p>
</div>
</section>

<section className="controls">
<input
type="text"
placeholder="Rechercher un produit..."
className="search-input"
/>
<select>
<option>Toutes les catégories</option>
</select>
<select>
<option>Tous les lieux</option>
</select>
<button className="add-btn" onClick={() => setIsModalOpen(true)}>
+ Ajouter un produit
</button>
</section>

<section className="products-list">
{products.length === 0 ? (
<div className="empty">
<p>Votre frigo est vide</p>
<small>
Commencez par ajouter vos premiers produits.<br/>
Astuce : ajoutez les dates d’expiration pour recevoir des alertes intelligentes.
</small>
</div>
) : (
<ul>
{products.map((p) => (
<li key={p.id}>{p.name}</li>
))}
</ul>
)}
</section>

{isModalOpen && (
<AddProductModal onClose={() => setIsModalOpen(false)} user={user} />
)}
</div>
);
}
