'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AddProductModal from "./AddProductModal.jsx";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase/firebase-config";
import {collection,deleteDoc,doc,getDoc,onSnapshot,orderBy,query,} from "firebase/firestore";

export default function FridgePage() {
// Auth + user doc
const [user, setUser] = useState(null);
const [userDoc, setUserDoc] = useState(null);
const [loading, setLoading] = useState(true);

// UI / données
const [isModalOpen, setIsModalOpen] = useState(false);
const [products, setProducts] = useState([]);

const pathname = usePathname();

// Abonnement à l'auth + chargement des données
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
const userRef = doc(db, "users", u.uid);
const snap = await getDoc(userRef);
if (snap.exists()) setUserDoc(snap.data());

const q = query(
collection(db, "users", u.uid, "products"),
orderBy("expirationDate")
);
onSnapshot(q, (snapshot) => {
const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
setProducts(list);
});
} catch (err) {
console.error("Erreur Firestore :", err);
} finally {
setLoading(false);
}
});

return () => unsub();
}, []);

// Suppression produit
const deleteProduct = async (id) => {
if (!user) return;
await deleteDoc(doc(db, "users", user.uid, "products", id));
};

if (loading) return <p>Chargement...</p>;

return (
<div className="fridge-container">
<h1>Salut {userDoc?.name || "utilisateur"} 👋</h1>

<div className="stats">
<div className="counter total">Total: {products.length}</div>
<div className="counter urgent">
Urgent: {products.filter((p) => p.status === "urgent").length}
</div>
<div className="counter expired">
Expirés: {products.filter((p) => p.status === "expired" || p.status === "expiré").length}
</div>
</div>

<button className="add-btn" onClick={() => setIsModalOpen(true)}>
+ Ajouter un produit
</button>

<div className="products-list">
{products.map((p) => (
<div key={p.id} className="product-card">
<span>{p.name}</span>
<button onClick={() => deleteProduct(p.id)}>❌</button>
</div>
))}
</div>

{isModalOpen && (
<AddProductModal closeModal={() => setIsModalOpen(false)} />
)}

{/* --- Barre d’onglets (navigation client avec Next Link) --- */}
<nav className="tabbar" role="navigation" aria-label="Navigation principale">
<Link
href="/fridge"
className={`tab ${pathname.includes("/fridge") ? "is-active" : ""}`}
>
<span className="tab__icon">❄️</span>
<span className="tab__label">Frigo</span>
</Link>

<Link
href="/repas"
className={`tab ${pathname.includes("/repas") ? "is-active" : ""}`}
>
<span className="tab__icon">🍽️</span>
<span className="tab__label">Repas</span>
</Link>

<Link
href="/settings"
className={`tab ${pathname.includes("/settings") ? "is-active" : ""}`}
>
<span className="tab__icon">⚙️</span>
<span className="tab__label">Paramètres</span>
</Link>
</nav>
</div>
);
}
