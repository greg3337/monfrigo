"use client";
import React, { useEffect, useState } from "react";
import AddProductModal from "./AddProductModal";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase-config"; // ajuste le chemin si besoin

export default function FridgePage() {
// ton état existant
const [products, setProducts] = useState([]);
const [isModalOpen, setIsModalOpen] = useState(false);

// debug abonnement
const [userDoc, setUserDoc] = useState(null);
const [loadingUser, setLoadingUser] = useState(true);

useEffect(() => {
const unsub = onAuthStateChanged(auth, async (u) => {
if (!u) {
console.log("[FRIDGE] Utilisateur non connecté.");
setUserDoc(null);
setLoadingUser(false);
return;
}
try {
const ref = doc(db, "users", u.uid);
const snap = await getDoc(ref);
console.log("[FRIDGE] Doc user existe ?", snap.exists());
if (snap.exists()) {
console.log("[FRIDGE] Données user:", snap.data());
setUserDoc(snap.data());
}
} catch (e) {
console.error("[FRIDGE] Erreur lecture doc user:", e);
} finally {
setLoadingUser(false);
}
});
return () => unsub();
}, []);

const addProduct = (product) => {
setProducts([...products, product]);
setIsModalOpen(false);
};

if (loadingUser) return <div style={{ padding: 20 }}>Chargement…</div>;

return (
<div style={{ padding: "20px" }}>
<h1>Mon Frigo</h1>

{/* Bloc debug, pour vérifier isSubscribed */}
<h3 style={{ marginTop: 12 }}>Debug utilisateur</h3>
<pre style={{ background: "#111", color: "#0f0", padding: 12 }}>
{JSON.stringify(userDoc, null, 2)}
</pre>

{userDoc && !userDoc.isSubscribed && (
<p style={{ color: "orange" }}>
Abonnement non détecté. Si tu viens de payer, attends 5–10 s et rafraîchis.
</p>
)}

<button onClick={() => setIsModalOpen(true)}>Ajouter un produit</button>

<ul>
{products.map((p, index) => (
<li key={index}>
{p.name} - {p.expiration}
</li>
))}
</ul>

{isModalOpen && (
<AddProductModal
onClose={() => setIsModalOpen(false)}
onAdd={addProduct}
/>
)}
</div>
);
}