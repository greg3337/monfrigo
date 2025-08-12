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
import "../styles/tabbar.css"; // ✅ Chemin corrigé

export default function FridgePage() {
// Auth + user doc
const [user, setUser] = useState(null);
const [userDoc, setUserDoc] = useState(null);
const [loading, setLoading] = useState(true);

// UI / données
const [isModalOpen, setIsModalOpen] = useState(false);
const [products, setProducts] = useState([]);

// Abonnement à l'auth + chargement du doc utilisateur
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
}

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
Expirés: {products.filter((p) => p.status === "expired").length}
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
</div>
);
}
