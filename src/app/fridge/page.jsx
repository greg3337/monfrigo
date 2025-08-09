"use client";
import React, { useEffect, useState } from "react";
import AddProductModal from "./AddProductModal";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase/firebase-config";
import {
collection,
addDoc,
onSnapshot,
query,
where,
orderBy,
doc,
getDoc,
serverTimestamp,
} from "firebase/firestore";

export default function FridgePage() {
const [user, setUser] = useState(null);
const [userDoc, setUserDoc] = useState(null);
const [loading, setLoading] = useState(true);

const [isModalOpen, setIsModalOpen] = useState(false);
const [products, setProducts] = useState([]);

// Auth + doc utilisateur
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

// Lecture live des produits de l’utilisateur
useEffect(() => {
if (!user) return;
const q = query(
collection(db, "products"),
where("uid", "==", user.uid),
orderBy("createdAt", "desc")
);
const unsub = onSnapshot(q, (snap) => {
const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
setProducts(list);
});
return () => unsub();
}, [user]);

// Ajout produit (écriture Firestore ici)
const addProduct = async (product) => {
try {
if (!user) return;
await addDoc(collection(db, "products"), {
...product,
uid: user.uid,
createdAt: serverTimestamp(),
});
setIsModalOpen(false);
} catch (e) {
console.error("[FRIDGE] Erreur add product:", e);
alert("Impossible d’ajouter le produit.");
}
};

if (loading) return <div style={{ padding: 20 }}>Chargement…</div>;

if (!user) {
return (
<div style={{ padding: 20 }}>
<h1>Mon Frigo</h1>
<p>Tu n’es pas connecté.</p>
</div>
);
}

if (!userDoc?.isSubscribed) {
return (
<div style={{ padding: 20 }}>
<h1>Mon Frigo</h1>
<p style={{ color: "orange" }}>
Abonnement non détecté. Si tu viens de payer, attends 5–10 secondes et
rafraîchis la page.
</p>
</div>
);
}

return (
<div style={{ padding: 20 }}>
<h1>Mon Frigo</h1>

<button onClick={() => setIsModalOpen(true)}>Ajouter un produit</button>

<ul>
{products.map((p) => (
<li key={p.id}>
{p.name} {p.expiration ? `– ${p.expiration}` : ""}
{p.category ? ` · ${p.category}` : ""}
</li>
))}
</ul>

{process.env.NODE_ENV === "development" && (
<>
<h3 style={{ marginTop: 12 }}>Debug utilisateur</h3>
<pre style={{ background: "#111", color: "#0f0", padding: 12 }}>
{JSON.stringify(userDoc, null, 2)}
</pre>
</>
)}

{isModalOpen && (
<AddProductModal
onClose={() => setIsModalOpen(false)}
onAdd={addProduct}
/>
)}
</div>
);
}
