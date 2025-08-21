"use client";

import React, { useEffect, useState } from "react";
import { db } from "../firebase/firebase-config";
import { useAuth } from "../hooks/useAuth";
import {
addDoc,
collection,
deleteDoc,
doc,
getDocs,
serverTimestamp,
} from "firebase/firestore";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const SLOTS = ["Déjeuner", "Dîner"];

export default function CreateMealModal({
defaultDay = DAYS[0],
defaultSlot = SLOTS[0],
onClose,
}) {
const { user } = useAuth();
const [day, setDay] = useState(defaultDay);
const [slot, setSlot] = useState(defaultSlot);
const [name, setName] = useState("");
const [loading, setLoading] = useState(true);
const [fridge, setFridge] = useState([]); // [{id, name}]
const [selectedIds, setSelectedIds] = useState(new Set());
const [error, setError] = useState("");

// Charger les produits du frigo
useEffect(() => {
let cancelled = false;
async function load() {
if (!user) return;
setLoading(true);
setError("");
try {
const snap = await getDocs(collection(db, "users", user.uid, "fridge"));
if (cancelled) return;
const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
setFridge(items);
} catch (e) {
setError("Impossible de charger les produits du frigo.");
} finally {
if (!cancelled) setLoading(false);
}
}
load();
return () => {
cancelled = true;
};
}, [user]);

const toggleSelect = (id) => {
setSelectedIds((prev) => {
const n = new Set(prev);
if (n.has(id)) n.delete(id);
else n.add(id);
return n;
});
};

const handleSave = async () => {
if (!user) return;
try {
const selectedItems = fridge
.filter((f) => selectedIds.has(f.id))
.map((f) => ({ id: f.id, name: f.name || f.label || f.product || "Produit" }));

// 1) créer le repas
await addDoc(collection(db, "users", user.uid, "meals"), {
day,
slot,
name: name.trim(),
items: selectedItems,
createdAt: serverTimestamp(),
});

// 2) supprimer du frigo les items sélectionnés
await Promise.all(
selectedItems.map((it) =>
deleteDoc(doc(db, "users", user.uid, "fridge", it.id))
)
);

onClose?.();
} catch (e) {
setError("Erreur lors de l’enregistrement.");
}
};

return (
<div className="modal_backdrop" onClick={onClose}>
<div className="modal" onClick={(e) => e.stopPropagation()}>
<div className="modal_head">
<h3>Ajouter un repas</h3>
<button className="btn_close" onClick={onClose}>×</button>
</div>

<div className="modal_body">
<div className="row">
<div className="field">
<label>Jour</label>
<select value={day} onChange={(e) => setDay(e.target.value)}>
{DAYS.map((d) => (
<option key={d} value={d}>{d}</option>
))}
</select>
</div>
<div className="field">
<label>Créneau</label>
<select value={slot} onChange={(e) => setSlot(e.target.value)}>
{SLOTS.map((s) => (
<option key={s} value={s}>{s}</option>
))}
</select>
</div>
</div>

<div className="field">
<label>Nom du repas (facultatif)</label>
<input
value={name}
onChange={(e) => setName(e.target.value)}
placeholder="Ex : Salade de poulet"
/>
</div>

<div className="field">
<label>Produits du frigo</label>

{loading && <div className="muted">Chargement…</div>}
{!loading && fridge.length === 0 && (
<div className="muted">Aucun produit trouvé dans le frigo.</div>
)}

{!loading && fridge.length > 0 && (
<ul className="checklist">
{fridge.map((p) => (
<li key={p.id}>
<label>
<input
type="checkbox"
checked={selectedIds.has(p.id)}
onChange={() => toggleSelect(p.id)}
/>
<span>{p.name || p.label || p.product}</span>
</label>
</li>
))}
</ul>
)}

{error && <div className="error">{error}</div>}
</div>
</div>

<div className="modal_actions">
<button className="btn_ghost" onClick={onClose}>Annuler</button>
<button className="btn_primary" onClick={handleSave}>Sauvegarder</button>
</div>
</div>
</div>
);
}
