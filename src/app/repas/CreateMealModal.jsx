"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
collection,
query,
where,
getDocs,
addDoc,
serverTimestamp,
deleteDoc,
doc,
} from "firebase/firestore";
import { db } from "../firebase/firebase-config";
import { useAuth } from "../hooks/useAuth";

/**
* Modal d'ajout de repas :
* - lit les produits depuis users/{uid}/items (même chemin que la page Frigo)
* - enregistre le repas dans users/{uid}/meals
* - supprime les produits consommés du frigo
*/

const DAYS = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const SLOTS = ["Déjeuner","Dîner"];

export default function CreateMealModal({ open, onClose }) {
const { user } = useAuth();
const [day, setDay] = useState(DAYS[0]);
const [slot, setSlot] = useState(SLOTS[0]);
const [name, setName] = useState("");
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");
const [fridgeItems, setFridgeItems] = useState([]); // [{id, name, expirationDate}]
const [selectedIds, setSelectedIds] = useState([]); // ids des produits choisis

// Charger les produits du frigo (users/{uid}/items)
useEffect(() => {
if (!open || !user) return;
(async () => {
try {
setError("");
setLoading(true);
const colRef = collection(db, `users/${user.uid}/items`);
// si tu tagges les items “consumed: false”, décommente la ligne suivante :
// const q = query(colRef, where("consumed", "==", false));
const q = query(colRef);
const snap = await getDocs(q);
const items = snap.docs.map(d => ({
id: d.id,
...d.data(),
}));
// tri par date d’expiration si dispo
items.sort((a,b) => (a.expirationDate || "") > (b.expirationDate || "") ? 1 : -1);
setFridgeItems(items);
setSelectedIds([]); // reset
} catch (e) {
console.error(e);
setError("Impossible de charger les produits du frigo.");
setFridgeItems([]);
} finally {
setLoading(false);
}
})();
}, [open, user]);

const canSave = useMemo(() => !!user && !loading, [user, loading]);

const toggleSelect = (id) => {
setSelectedIds(prev =>
prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
);
};

const handleSave = async () => {
if (!canSave) return;
setLoading(true);
setError("");

try {
const meal = {
day,
slot,
name: name.trim() || null,
productIds: selectedIds, // on stocke les IDs utilisés
createdAt: serverTimestamp(),
};

// 1) créer le repas dans users/{uid}/meals
const mealsRef = collection(db, `users/${user.uid}/meals`);
await addDoc(mealsRef, meal);

// 2) supprimer les produits choisis du frigo
if (selectedIds.length) {
await Promise.all(
selectedIds.map((pid) =>
deleteDoc(doc(db, `users/${user.uid}/items/${pid}`))
)
);
}

// reset & fermer
setName("");
setSelectedIds([]);
onClose?.(true); // true = a enregistré
} catch (e) {
console.error(e);
setError("Une erreur est survenue à l’enregistrement.");
} finally {
setLoading(false);
}
};

if (!open) return null;

return (
<div className="modalOverlay" onClick={() => onClose?.(false)}>
<div className="modalCard" onClick={(e) => e.stopPropagation()}>
<div className="modalHeader">
<h3>Ajouter un repas</h3>
<button className="btnClose" onClick={() => onClose?.(false)}>×</button>
</div>

<div className="gridTwo">
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

<label style={{ display:"block", marginTop:12 }}>
Nom du repas (facultatif)
<input
type="text"
placeholder="Ex : Salade de poulet"
value={name}
onChange={e => setName(e.target.value)}
/>
</label>

<div style={{ marginTop:16 }}>
<div className="sectionTitle">Produits du frigo</div>

{error && <p className="error">{error}</p>}

{!error && loading && <p>Chargement…</p>}

{!error && !loading && fridgeItems.length === 0 && (
<p>Aucun produit trouvé dans le frigo.</p>
)}

{!error && !loading && fridgeItems.length > 0 && (
<ul className="fridgeList">
{fridgeItems.map(item => (
<li key={item.id}>
<label className="checkLine">
<input
type="checkbox"
checked={selectedIds.includes(item.id)}
onChange={() => toggleSelect(item.id)}
/>
<span className="name">{item.name || "Sans nom"}</span>
{item.expirationDate && (
<span className="muted">
{item.expirationDate}
</span>
)}
</label>
</li>
))}
</ul>
)}
</div>

<div className="modalActions">
<button className="btnGhost" onClick={() => onClose?.(false)}>Annuler</button>
<button className="btnPrimary" disabled={!canSave} onClick={handleSave}>
Sauvegarder
</button>
</div>
</div>
</div>
);
}
