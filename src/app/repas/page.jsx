// src/app/repas/page.jsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
collection,
getDocs,
addDoc,
writeBatch,
doc,
serverTimestamp,
deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebase-config";
import useAuth from "../hooks/useAuth";
import "./repas.css"; // commente cette ligne si tu n'as pas encore le fichier

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const SLOTS = ["Déjeuner", "Dîner"];

/** Essaie plusieurs noms de sous-collections possibles pour le frigo.
* Retourne { items: [{id,name,expiresAt,col}], colName } ou {items:[], colName:null}
*/
async function loadFridgeItems(db, uid) {
const candidates = ["fridge", "fridgeItems", "items", "products", "frigo"];
for (const colName of candidates) {
try {
const q = collection(db, "users", uid, colName);
const snap = await getDocs(q);
if (!snap.empty) {
const items = snap.docs.map((d) => {
const data = d.data() || {};
return {
id: d.id,
name: data.name || data.label || data.title || "Produit",
expiresAt: data.expiryDate || data.expiresAt || data.date || null,
col: colName,
};
});
return { items, colName };
}
} catch {
// on essaie le prochain
}
}
return { items: [], colName: null };
}

export default function RepasPage() {
const { user } = useAuth();

const [isOpen, setIsOpen] = useState(false);
const [loadingFridge, setLoadingFridge] = useState(false);
const [fridgeError, setFridgeError] = useState("");
const [fridgeItems, setFridgeItems] = useState([]);
const [fridgeCol, setFridgeCol] = useState(null);

const [day, setDay] = useState(DAYS[0]);
const [slot, setSlot] = useState(SLOTS[0]);
const [mealName, setMealName] = useState("");
const [selectedIds, setSelectedIds] = useState([]);

// Charge les produits du frigo quand la modale s’ouvre
useEffect(() => {
if (!isOpen || !user) return;
setLoadingFridge(true);
setFridgeError("");
(async () => {
const { items, colName } = await loadFridgeItems(db, user.uid);
setFridgeItems(items);
setFridgeCol(colName);
setLoadingFridge(false);
if (!colName) {
setFridgeError(
"Aucune sous-collection de frigo trouvée (fridge, fridgeItems, items, products, frigo)."
);
}
})();
}, [isOpen, user]);

const canSave = useMemo(() => {
return Boolean(user) && selectedIds.length > 0;
}, [user, selectedIds]);

function toggleSelection(id) {
setSelectedIds((prev) =>
prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
);
}

async function handleSave() {
if (!user) return;
try {
// 1) crée le repas
await addDoc(collection(db, "users", user.uid, "meals"), {
day,
slot,
name: mealName?.trim() || null,
productIds: selectedIds,
createdAt: serverTimestamp(),
});

// 2) supprime les produits du frigo sélectionnés
if (fridgeCol) {
const batch = writeBatch(db);
selectedIds.forEach((id) => {
const ref = doc(db, "users", user.uid, fridgeCol, id);
batch.delete(ref);
});
await batch.commit();
}

// 3) reset + fermer
setSelectedIds([]);
setMealName("");
setIsOpen(false);
} catch (e) {
alert("Une erreur est survenue lors de l’enregistrement du repas.");
console.error(e);
}
}

return (
<div className="page-wrap" style={{ padding: "16px" }}>
<header style={{ marginBottom: 16 }}>
<h1 style={{ margin: 0 }}>🍽️ Mes repas</h1>
<p style={{ marginTop: 4, color: "#666" }}>
Planifie tes repas de la semaine
</p>
<button
onClick={() => setIsOpen(true)}
className="btnPrimary"
style={{ marginTop: 8 }}
>
+ Ajouter un repas
</button>
</header>

{/* grille simple jours/créneaux (placeholder d’affichage) */}
<div
style={{
display: "grid",
gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
gap: 12,
}}
>
{DAYS.map((d) => (
<div key={d} style={{ border: "1px dashed #ddd", borderRadius: 8, padding: 12 }}>
<div style={{ fontWeight: 600, marginBottom: 8 }}>{d}</div>
{SLOTS.map((s) => (
<div
key={s}
style={{
border: "1px solid #eee",
borderRadius: 6,
padding: 10,
marginBottom: 8,
background: "#fafafa",
}}
>
<div style={{ fontWeight: 500, marginBottom: 6 }}>{s}</div>
<div style={{ fontSize: 13, color: "#777", marginBottom: 6 }}>
Aucun repas
</div>
<button
className="btnGhost"
onClick={() => {
setDay(d);
setSlot(s);
setIsOpen(true);
}}
>
+ Ajouter
</button>
</div>
))}
</div>
))}
</div>

{/* MODALE */}
{isOpen && (
<div
onClick={() => setIsOpen(false)}
style={{
position: "fixed",
inset: 0,
background: "rgba(0,0,0,.35)",
display: "grid",
placeItems: "center",
zIndex: 50,
}}
>
<div
onClick={(e) => e.stopPropagation()}
style={{
width: "min(92vw, 560px)",
background: "#fff",
borderRadius: 12,
boxShadow: "0 10px 30px rgba(0,0,0,.15)",
padding: 16,
}}
>
<div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
<h3 style={{ margin: 0, fontSize: 18 }}>Ajouter un repas</h3>
<div style={{ marginLeft: 8, color: "#888" }}>
— {day} • {slot}
</div>
<button
onClick={() => setIsOpen(false)}
style={{
marginLeft: "auto",
border: "none",
background: "transparent",
fontSize: 18,
cursor: "pointer",
}}
aria-label="Fermer"
>
×
</button>
</div>

{/* Sélecteurs */}
<div
style={{
display: "grid",
gridTemplateColumns: "1fr 1fr",
gap: 8,
marginBottom: 10,
}}
>
<label style={{ display: "grid", gap: 6 }}>
<span>Jour</span>
<select value={day} onChange={(e) => setDay(e.target.value)}>
{DAYS.map((d) => (
<option key={d} value={d}>
{d}
</option>
))}
</select>
</label>

<label style={{ display: "grid", gap: 6 }}>
<span>Créneau</span>
<select value={slot} onChange={(e) => setSlot(e.target.value)}>
{SLOTS.map((s) => (
<option key={s} value={s}>
{s}
</option>
))}
</select>
</label>
</div>

<label style={{ display: "grid", gap: 6, marginBottom: 12 }}>
<span>Nom du repas (facultatif)</span>
<input
placeholder="Ex : Salade de poulet"
value={mealName}
onChange={(e) => setMealName(e.target.value)}
/>
</label>

<div style={{ fontWeight: 600, margin: "10px 0 6px" }}>Produits du frigo</div>

<div
style={{
maxHeight: 220,
overflow: "auto",
border: "1px solid #eee",
borderRadius: 8,
padding: 8,
background: "#fafafa",
}}
>
{loadingFridge && <div>Chargement...</div>}

{!loadingFridge && fridgeError && (
<div style={{ color: "#d33" }}>{fridgeError}</div>
)}

{!loadingFridge && !fridgeError && fridgeItems.length === 0 && (
<div style={{ color: "#666" }}>
Aucun produit trouvé. Ajoute des produits dans l’onglet Frigo.
</div>
)}

{!loadingFridge &&
fridgeItems.map((it) => (
<label
key={`${it.col}:${it.id}`}
style={{
display: "flex",
alignItems: "center",
gap: 10,
padding: "6px 8px",
background: "#fff",
border: "1px solid #eee",
borderRadius: 6,
marginBottom: 6,
}}
>
<input
type="checkbox"
checked={selectedIds.includes(it.id)}
onChange={() => toggleSelection(it.id)}
/>
<div style={{ flex: 1 }}>
<div style={{ fontWeight: 500 }}>{it.name}</div>
{it.expiresAt && (
<div style={{ fontSize: 12, color: "#888" }}>
DLC : {String(it.expiresAt).slice(0, 10)}
</div>
)}
</div>
</label>
))}
</div>

<div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
<button className="btnGhost" onClick={() => setIsOpen(false)}>
Annuler
</button>
<button
className="btnPrimary"
onClick={handleSave}
disabled={!canSave}
title={!canSave ? "Sélectionne au moins un produit" : "Sauvegarder"}
>
Sauvegarder
</button>
</div>
</div>
</div>
)}
</div>
);
}
