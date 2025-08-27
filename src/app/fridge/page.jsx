"use client";
import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import {
collection,
query,
onSnapshot,
addDoc,
deleteDoc,
doc,
} from "firebase/firestore";
import { db } from "../../firebase/firebase-config";
import "../../styles/fridge.css"; // ton CSS pour le frigo
import TabBar from "../../styles/tabbar"; // tes onglets en bas

export default function FridgePage() {
const auth = getAuth();
const user = auth.currentUser;
const [products, setProducts] = useState([]);
const [visible, setVisible] = useState([]);
const [isModalOpen, setIsModalOpen] = useState(false);

// Récupérer les produits en temps réel depuis Firestore
useEffect(() => {
if (!user) return;
const q = query(collection(db, "users", user.uid, "fridge"));
const unsub = onSnapshot(q, (snapshot) => {
const items = snapshot.docs.map((doc) => ({
id: doc.id,
...doc.data(),
}));
setProducts(items);
setVisible(items);
});
return () => unsub();
}, [user]);

// Supprimer un produit
const deleteProduct = async (id) => {
if (!user) return;
await deleteDoc(doc(db, "users", user.uid, "fridge", id));
};

// Calculer les stats
const stats = {
total: products.length,
urgent: products.filter((p) => {
if (!p.expirationDate) return false;
const today = new Date(); today.setHours(0,0,0,0);
const d = new Date(p.expirationDate); d.setHours(0,0,0,0);
const diff = Math.round((d - today) / 86400000);
return diff >= 0 && diff <= 2;
}).length,
expired: products.filter((p) => {
if (!p.expirationDate) return false;
const today = new Date(); today.setHours(0,0,0,0);
const d = new Date(p.expirationDate); d.setHours(0,0,0,0);
return d < today;
}).length,
};

return (
<div className="page">
<h1>Mon Frigo</h1>
<p>Salut, {user?.displayName || "👋"}</p>

{/* Statistiques */}
<div className="stats">
<div className="stat total">Total <br /> {stats.total}</div>
<div className="stat urgent">Urgent <br /> {stats.urgent}</div>
<div className="stat expired">Expirés <br /> {stats.expired}</div>
</div>

{/* Liste produits */}
<div className="content">
<ul className="grid">
{visible.map((p) => {
// calcul du statut
const status = (() => {
if (!p.expirationDate) return "ok";
const today = new Date(); today.setHours(0,0,0,0);
const d = new Date(p.expirationDate); d.setHours(0,0,0,0);
const diff = Math.round((d - today) / 86400000);
return diff < 0 ? "expired" : diff <= 2 ? "urgent" : "ok";
})();

return (
<li
key={p.id}
className={`item ${status==='urgent'?'item--urgent':''} ${status==='expired'?'item--expired':''}`}
>
<div className="itemMeta">
<span className="itemName">{p.name}</span>

{/* badge si urgent ou expiré */}
{status === "urgent" && (
<span className="tag tag-urgent">⚠ Urgent</span>
)}
{status === "expired" && (
<span className="tag tag-expired">⛔ Expiré</span>
)}

<span className="pill">{p.expirationDate}</span>
</div>

<button className="deleteBtn" onClick={() => deleteProduct(p.id)}>
Supprimer
</button>
</li>
);
})}
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

{/* Onglets en bas */}
<TabBar />
</div>
);
}
