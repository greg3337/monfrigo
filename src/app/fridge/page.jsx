"use client";
import React, { useEffect, useState } from "react";
import AddProductModal from "../AddProductModal";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebase-config";
import {
collection,
deleteDoc,
doc,
getDoc,
onSnapshot,
orderBy,
query,
} from "firebase/firestore";
import "../../styles/tabbar.css"; // Styles pour les onglets

export default function FridgePage() {
// Auth + user doc
const [user, setUser] = useState(null);
const [userDoc, setUserDoc] = useState(null);
const [loading, setLoading] = useState(true);

// UI / données
const [isModalOpen, setIsModalOpen] = useState(false);
const [products, setProducts] = useState([]);
const [activeTab, setActiveTab] = useState("fridge"); // Onglet actif

// Auth + récupération doc utilisateur
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
// Récup infos utilisateur
const docRef = doc(db, "users", u.uid);
const snap = await getDoc(docRef);
if (snap.exists()) {
setUserDoc(snap.data());
}

// Produits triés par date d'expiration
const productsRef = collection(db, "users", u.uid, "products");
const q = query(productsRef, orderBy("expirationDate"));
onSnapshot(q, (snapshot) => {
const list = snapshot.docs.map((d) => ({
id: d.id,
...d.data(),
}));
setProducts(list);
});
} catch (error) {
console.error("Erreur Firestore :", error);
} finally {
setLoading(false);
}
});

return () => unsub();
}, []);

// Supprimer produit
const deleteProduct = async (id) => {
if (!user) return;
await deleteDoc(doc(db, "users", user.uid, "products", id));
};

if (loading) return <p>Chargement...</p>;

return (
<div className="fridge-container">
{/* Nom utilisateur */}
<h1>Salut {userDoc?.name || "utilisateur"} 👋</h1>

{/* Onglets */}
<div className="tabbar">
<button
className={activeTab === "fridge" ? "active" : ""}
onClick={() => setActiveTab("fridge")}
>
🥶 Mon Frigo
</button>
<button
className={activeTab === "recipes" ? "active" : ""}
onClick={() => setActiveTab("recipes")}
>
🍽 Recettes
</button>
<button
className={activeTab === "shopping" ? "active" : ""}
onClick={() => setActiveTab("shopping")}
>
🛒 Liste Courses
</button>
</div>

{/* Contenu selon onglet */}
{activeTab === "fridge" && (
<>
{/* Stats */}
<div className="stats">
<div>Total: {products.length}</div>
<div>
Urgent: {products.filter((p) => p.status === "urgent").length}
</div>
<div>
Expirés: {products.filter((p) => p.status === "expiré").length}
</div>
</div>

{/* Bouton ajout produit */}
<button className="add-btn" onClick={() => setIsModalOpen(true)}>
➕ Ajouter un produit
</button>

{/* Liste produits */}
<div className="products-list">
{products.map((p) => (
<div key={p.id} className="product-card">
<span>{p.name}</span>
<button onClick={() => deleteProduct(p.id)}>❌</button>
</div>
))}
</div>
</>
)}

{activeTab === "recipes" && (
<div>
<h2>Recettes à venir...</h2>
</div>
)}

{activeTab === "shopping" && (
<div>
<h2>Liste de courses à venir...</h2>
</div>
)}

{/* Modal ajout produit */}
{isModalOpen && (
<AddProductModal closeModal={() => setIsModalOpen(false)} />
)}
</div>
);
}
