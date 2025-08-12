"use client";
import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/context/use-auth";
import AddProductModal from "./AddProductModal";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "../../styles/tabbar.css"

export default function FridgePage() {
const { user } = useAuth();
const [products, setProducts] = useState([]);
const [showModal, setShowModal] = useState(false);

const pathname = usePathname();
const tabs = [
{ href: "/fridge", label: "Frigo", icon: "🧊" },
{ href: "/repas", label: "Repas", icon: "🍽️" },
{ href: "/settings", label: "Paramètres", icon: "⚙️" },
];

useEffect(() => {
if (!user) return;
const q = query(collection(db, "products"), where("uid", "==", user.uid));
const unsubscribe = onSnapshot(q, (snapshot) => {
const items = [];
snapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
setProducts(items);
});
return () => unsubscribe();
}, [user]);

const total = products.length;
const urgent = products.filter((p) => {
if (!p.expiration) return false;
const diff =
(new Date(p.expiration).getTime() - new Date().getTime()) /
(1000 * 60 * 60 * 24);
return diff <= 3 && diff > 0;
}).length;
const expired = products.filter((p) => {
if (!p.expiration) return false;
return new Date(p.expiration) < new Date();
}).length;

return (
<div className="wrap">
<h1>Salut {user?.displayName || "!"} 👋</h1>

{/* Stats */}
<div className="stats">
<div className="stat total">
<span>{total}</span>
<p>Total</p>
</div>
<div className="stat urgent">
<span>{urgent}</span>
<p>Urgent</p>
</div>
<div className="stat expired">
<span>{expired}</span>
<p>Expirés</p>
</div>
</div>

{/* Barre recherche + filtre + bouton */}
<div className="controls">
<input
type="text"
placeholder="Rechercher un produit..."
className="search"
/>
<select>
<option>Toutes les catégories</option>
</select>
<select>
<option>Tous les lieux</option>
</select>
<button className="add-btn" onClick={() => setShowModal(true)}>
+ Ajouter un produit
</button>
</div>

{/* Liste produits */}
<div className="product-list">
{products.map((p) => (
<div key={p.id} className="product-item">
<div>
<strong>{p.name}</strong>
{p.expiration && (
<div>DLUO : {p.expiration}</div>
)}
</div>
{p.category && (
<span className="category">{p.category}</span>
)}
</div>
))}

{products.length === 0 && (
<div className="empty">
<p>Votre frigo est vide</p>
<small>Ajoutez vos premiers produits</small>
</div>
)}
</div>

{showModal && (
<AddProductModal
onClose={() => setShowModal(false)}
onAdd={(prod) => {
// l’écriture Firestore est gérée dans FridgeInventory ou ici si besoin
}}
/>
)}

{/* Barre d’onglets bas */}
<nav className="tabbar" role="navigation" aria-label="Navigation principale">
<div className="tabs">
{tabs.map((t) => {
const active = pathname.startsWith(t.href);
return (
<Link
key={t.href}
href={t.href}
className={`tablink ${active ? "active" : ""}`}
>
<span className="tabicon" aria-hidden>{t.icon}</span>
<span className="tablabel">{t.label}</span>
</Link>
);
})}
</div>
</nav>
</div>
);
}
