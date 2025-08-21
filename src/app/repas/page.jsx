"use client";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import React, { useEffect, useMemo, useState } from "react";
import { collection, query, orderBy, getDocs, addDoc, writeBatch, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase-config";
import useAuth from "../hooks/useAuth";
import "./repas.css";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const SLOTS = ["Déjeuner", "Dîner"];

export default function RepasPage() {
const { user } = useAuth(); // <- NE PAS destructurer si null côté SSR
const [loading, setLoading] = useState(false);
const [fridgeItems, setFridgeItems] = useState([]);
const [selectedIds, setSelectedIds] = useState(new Set());
const [day, setDay] = useState(DAYS[0]);
const [slot, setSlot] = useState(SLOTS[0]);
const [mealName, setMealName] = useState("");

// ---------- Chargement des produits du frigo ----------
useEffect(() => {
if (!user) return;
const load = async () => {
setLoading(true);
try {
const q = query(
collection(db, "users", user.uid, "fridge"),
orderBy("expiresAt", "asc")
);
const snap = await getDocs(q);
const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
setFridgeItems(items);
} catch (e) {
console.error("Erreur chargement frigo:", e);
} finally {
setLoading(false);
}
};
load();
}, [user]);

// ---------- Helpers ----------
const toggleSelect = (id) => {
setSelectedIds(prev => {
const next = new Set(prev);
if (next.has(id)) next.delete(id);
else next.add(id);
return next;
});
};

const selectedProducts = useMemo(
() => fridgeItems.filter(i => selectedIds.has(i.id)),
[fridgeItems, selectedIds]
);

// ---------- Sauvegarde repas + suppression produits ----------
const saveMeal = async () => {
if (!user) return;
if (selectedIds.size === 0) {
alert("Sélectionne au moins un produit du frigo.");
return;
}
setLoading(true);
try {
// 1) Créer le repas
await addDoc(collection(db, "users", user.uid, "meals"), {
day,
slot,
name: mealName?.trim() || null,
products: selectedProducts.map(p => ({
id: p.id,
name: p.name || p.productName || "",
expiresAt: p.expiresAt || null,
category: p.category || null,
})),
createdAt: serverTimestamp(),
});

// 2) Supprimer en BATCH les produits du frigo utilisés
const batch = writeBatch(db);
selectedProducts.forEach(p => {
batch.delete(doc(db, "users", user.uid, "fridge", p.id));
});
await batch.commit();

// 3) Reset UI
setSelectedIds(new Set());
setMealName("");
// recharger le frigo
const snap = await getDocs(collection(db, "users", user.uid, "fridge"));
setFridgeItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
alert("Repas créé et produits retirés du frigo ✅");
} catch (e) {
console.error("Erreur sauvegarde repas:", e);
alert("Impossible d’enregistrer le repas.");
} finally {
setLoading(false);
}
};

// ---------- Rendu ----------
if (!user) {
return <div style={{ padding: 16 }}>Chargement…</div>;
}

return (
<div className="repas_page">
<header className="repas_header">
<div className="repas_title">
<span role="img" aria-label="plate">🍽️</span>&nbsp; Mes repas
</div>
<p className="repas_sub">Planifie tes repas de la semaine</p>
</header>

<section className="repas_form">
<div className="row">
<label>
Jour
<select value={day} onChange={e => setDay(e.target.value)}>
{DAYS.map(d => <option key={d} value={d}>{d}</option>)}
</select>
</label>

<label>
Créneau
<select value={slot} onChange={e => setSlot(e.target.value)}>
{SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
</select>
</label>
</div>

<label className="full">
Nom du repas (facultatif)
<input
placeholder="Ex : Salade de poulet"
value={mealName}
onChange={e => setMealName(e.target.value)}
/>
</label>
</section>

<section className="repas_fridge">
<h3>Produits du frigo</h3>

{loading && <div className="hint">Chargement…</div>}

{!loading && fridgeItems.length === 0 && (
<div className="hint">Aucun produit trouvé dans le frigo.</div>
)}

<ul className="fridge_list">
{fridgeItems.map(item => (
<li key={item.id} className={`fridge_item ${selectedIds.has(item.id) ? "is-selected" : ""}`}>
<label>
<input
type="checkbox"
checked={selectedIds.has(item.id)}
onChange={() => toggleSelect(item.id)}
/>
<span className="name">{item.name || item.productName}</span>
{item.expiresAt && <span className="exp">⏳ {item.expiresAt}</span>}
</label>
</li>
))}
</ul>
</section>

<div className="repas_actions">
<button className="btn ghost" disabled={loading} onClick={() => { setSelectedIds(new Set()); setMealName(""); }}>
Annuler
</button>
<button className="btn primary" disabled={loading || selectedIds.size === 0} onClick={saveMeal}>
{loading ? "Enregistrement…" : "Sauvegarder"}
</button>
</div>

{/* Barre onglets : c'est géré par ton layout global */}
</div>
);
}
