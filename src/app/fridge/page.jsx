"use client";

import React, { useEffect, useState } from "react";
import AddProductModal from "./AddProductModal";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase/firebase-config";
import {
collection,
deleteDoc,
doc,
getDoc,
onSnapshot,
orderBy,
query,
} from "firebase/firestore";
import "../../styles/tabbar.css"; // TabBar styles

export default function FridgePage() {
// Auth + user doc
const [user, setUser] = useState(null);
const [userDoc, setUserDoc] = useState(null);
const [loading, setLoading] = useState(true);

// UI / données
const [isModalOpen, setIsModalOpen] = useState(false);
const [products, setProducts] = useState([]);

// Abonnement à l'auth + chargement doc utilisateur
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
const docRef = doc(db, "users", u.uid);
const snap = await getDoc(docRef);

if (snap.exists()) {
setUserDoc(snap.data());

// Récupérer les produits en temps réel
const productsRef = collection(db, "users", u.uid, "products");
const q = query(productsRef, orderBy("expiryDate", "asc"));

onSnapshot(q, (snapshot) => {
const items = snapshot.docs.map((d) => ({
id: d.id,
...d.data(),
}));
setProducts(items);
});
}
} catch (error) {
console.error("Erreur récupération utilisateur :", error);
}

setLoading(false);
});

return () => unsub();
}, []);

// Suppression produit
const handleDelete = async (id) => {
if (!user) return;
try {
await deleteDoc(doc(db, "users", user.uid, "products", id));
} catch (error) {
console.error("Erreur suppression produit :", error);
}
};

// Calcul compteurs
const totalCount = products.length;
const urgentCount = products.filter((p) => {
const days = (new Date(p.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
return days <= 3 && days > 0;
}).length;
const expiredCount = products.filter(
(p) => new Date(p.expiryDate) < new Date()
).length;

if (loading) return <p>Chargement...</p>;

return (
<div className="fridge-container">
<h2>Mes Produits</h2>
<p>Gérez vos aliments intelligemment</p>

{/* Compteurs */}
<div className="counters">
<div className="counter total">{totalCount} Total</div>
<div className="counter urgent">{urgentCount} Urgent</div>
<div className="counter expired">{expiredCount} Expirés</div>
</div>

{/* Bouton ajout produit */}
<button onClick={() => setIsModalOpen(true)} className="add-btn">
+ Ajouter un produit
</button>

{/* Liste produits */}
<div className="products-list">
{products.length === 0 ? (
<p>Votre frigo est vide.</p>
) : (
products.map((p) => (
<div key={p.id} className="product-card">
<span>{p.name}</span>
<span>{p.expiryDate}</span>
<button onClick={() => handleDelete(p.id)}>Supprimer</button>
</div>
))
)}
</div>

{/* Modal ajout */}
{isModalOpen && (
<AddProductModal
onClose={() => setIsModalOpen(false)}
onAdd={() => {}}
/>
)}

{/* TabBar */}
<nav className="tabbar">
<a href="/fridge" className="tablink active">
🧊 Frigo
</a>
<a href="/repas" className="tablink">
🍽️ Repas
</a>
<a href="/settings" className="tablink">
⚙️ Paramètres
</a>
</nav>
</div>
);
}
