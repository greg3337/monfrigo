"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AddProductModal from "./AddProductModal.jsx";

import { onAuthStateChanged } from "firebase/auth";
import {
collection,
deleteDoc,
doc,
getDoc,
onSnapshot,
orderBy,
query,
} from "firebase/firestore";

// ⚠️ adapte ce chemin si besoin (../firebase-config ou ../firebase/firebase-config)
import { auth, db } from "../firebase-config";

import "../styles/tabbar.css";

/* ---------- Statut visuel (fallback si p.status absent) ---------- */
function computeStatus(p) {
if (p?.status) return p.status;
if (!p?.expirationDate) return "ok";
try {
const today = new Date();
const d = new Date(p.expirationDate);
d.setHours(0, 0, 0, 0);
today.setHours(0, 0, 0, 0);
const diffDays = Math.round((d - today) / 86400000);
if (diffDays < 0) return "expired";
if (diffDays <= 2) return "urgent";
return "ok";
} catch {
return "ok";
}
}

export default function FridgePage() {
const [user, setUser] = useState(null);
const [userDoc, setUserDoc] = useState(null);
const [loading, setLoading] = useState(true);
const [products, setProducts] = useState([]);

const [isModalOpen, setIsModalOpen] = useState(false);
const [q, setQ] = useState("");
const [category, setCategory] = useState("all");
const [place, setPlace] = useState("all");

const pathname = usePathname();

useEffect(() => {
const unsubAuth = onAuthStateChanged(auth, async (u) => {
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

const qRef = query(
collection(db, "users", u.uid, "products"),
orderBy("expirationDate")
);
const unsubProd = onSnapshot(qRef, (s) => {
const list = s.docs.map((d) => ({ id: d.id, ...d.data() }));
setProducts(list);
setLoading(false);
});
return () => unsubProd();
} catch (e) {
console.error("Firestore error:", e);
setLoading(false);
}
});

return () => unsubAuth();
}, []);

const deleteProduct = async (id) => {
if (!user) return;
await deleteDoc(doc(db, "users", user.uid, "products", id));
};

const visible = useMemo(() => {
const qlc = q.trim().toLowerCase();
return products.filter((p) => {
const nameOk = !qlc || String(p.name || "").toLowerCase().includes(qlc);
const catOk = category === "all" || (p.category || "") === category;
const placeOk = place === "all" || (p.place || "") === place;
return nameOk && catOk && placeOk;
});
}, [products, q, category, place]);

const total = visible.length;
const urgentCount = visible.filter((p) => computeStatus(p) === "urgent").length;
const expiredCount = visible.filter((p) => computeStatus(p) === "expired").length;

if (loading) return <p>Chargement…</p>;

return (
<>
<div className="wrap">
{/* Header */}
<div className="header">
<div className="brand">
<div className="brandTitle">Mon Frigo</div>
<div className="brandSub">
Salut,{" "}
{typeof user?.displayName === "string" && user.displayName.trim()
? user.displayName
: typeof userDoc?.name === "string" && userDoc.name.trim()
? userDoc.name
: "👋"}
</div>
</div>
</div>

{/* Stats */}
<div className="stats">
<div className="card green">
<div className="cardLabel">Total</div>
<div className="cardValue">{total}</div>
</div>
<div className="card orange">
<div className="cardLabel">Urgent</div>
<div className="cardValue">{urgentCount}</div>
</div>
<div className="card red">
<div className="cardLabel">Expirés</div>
<div className="cardValue">{expiredCount}</div>
</div>
</div>

{/* Toolbar */}
<div className="toolbar">
<input
className="input"
placeholder="Rechercher un produit…"
value={q}
onChange={(e) => setQ(e.target.value)}
/>
{/* garde/branche tes selects si besoin */}
<button className="primary" onClick={() => setIsModalOpen(true)}>
+ Ajouter un produit
</button>
</div>

{/* Liste */}
<ul className="list">
{visible.map((p) => {
const status = computeStatus(p);
return (
<li key={p.id} className="item">
<div className="itemMeta">
<span className="itemName">{p.name}</span>

{status === "urgent" && (
<span className="tag tag-urgent">Urgent</span>
)}
{status === "expired" && (
<span className="tag tag-expired">Expiré</span>
)}

{p.expirationDate && (
<span className="pill">{p.expirationDate}</span>
)}
</div>

<button className="deleteBtn" onClick={() => deleteProduct(p.id)}>
Supprimer
</button>
</li>
);
})}
</ul>

{visible.length === 0 && (
<div className="empty">
<div className="emptyTitle">Votre frigo est vide</div>
<div className="emptySub">
Ajoutez vos premiers produits pour commencer.
</div>
<button className="primary" onClick={() => setIsModalOpen(true)}>
Ajouter un produit
</button>
</div>
)}

{isModalOpen && (
<AddProductModal onClose={() => setIsModalOpen(false)} user={user} />
)}
</div>

{/* --------- Onglets bas de page --------- */}
<footer className="tabbar">
<Link
href="/fridge"
className={`tabbarItem ${pathname?.startsWith("/fridge") ? "active" : ""}`}
>
<img src="/file.svg" alt="" width="22" height="22" />
<span>Frigo</span>
</Link>

{/* Optionnel : un onglet “Rechercher”
<Link
href="/search"
className={`tabbarItem ${pathname?.startsWith("/search") ? "active" : ""}`}
>
<img src="/globe.svg" alt="" width="22" height="22" />
<span>Rechercher</span>
</Link> */}

<Link
href="/settings"
className={`tabbarItem ${pathname?.startsWith("/settings") ? "active" : ""}`}
>
<img src="/window.svg" alt="" width="22" height="22" />
<span>Paramètres</span>
</Link>
</footer>
</>
);
}
