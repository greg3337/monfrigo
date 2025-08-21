'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { db } from '../../firebase/firebase-config';
import {
collection,
query,
where,
getDocs,
addDoc,
serverTimestamp,
deleteDoc,
doc,
} from 'firebase/firestore';
import './repas.css';

const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const SLOTS = ['Déjeuner','Dîner'];

export default function CreateMealModal({
user,
defaultDay = 'Lundi',
defaultSlot = 'Déjeuner',
onClose,
onSaved,
}) {
const [day, setDay] = useState(defaultDay);
const [slot, setSlot] = useState(defaultSlot);
const [name, setName] = useState('');
const [products, setProducts] = useState([]); // {id, name}
const [loading, setLoading] = useState(true);
const [loadError, setLoadError] = useState('');

// Charger les produits du frigo (chemin: users/{uid}/fridge)
useEffect(() => {
if (!user) return;
let mounted = true;

async function load() {
setLoading(true);
setLoadError('');
try {
const fridgeCol = collection(db, `users/${user.uid}/fridge`);
const snap = await getDocs(fridgeCol);
const arr = [];
snap.forEach((d) => {
const data = d.data() || {};
arr.push({ id: d.id, name: data.name || data.label || 'Produit' });
});
if (mounted) {
setProducts(arr);
}
} catch (e) {
console.error('load fridge error:', e);
if (mounted) setLoadError("Impossible de charger les produits du frigo.");
} finally {
if (mounted) setLoading(false);
}
}

load();
return () => { mounted = false; };
}, [user]);

const [selectedIds, setSelectedIds] = useState([]);

const toggleId = (id) => {
setSelectedIds((prev) =>
prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
);
};

const canSave = useMemo(() => {
// autoriser même sans produits sélectionnés (nom libre)
return !!user && !!day && !!slot && (name.trim().length > 0 || selectedIds.length > 0);
}, [user, day, slot, name, selectedIds]);

const handleSave = async () => {
if (!canSave) return;

try {
// 1) Créer le repas
await addDoc(collection(db, 'meals'), {
userId: user.uid,
day,
slot,
name: name.trim() || 'Repas',
productIds: selectedIds,
createdAt: serverTimestamp(),
});

// 2) Supprimer les produits sélectionnés du frigo
for (const pid of selectedIds) {
try {
await deleteDoc(doc(db, `users/${user.uid}/fridge`, pid));
} catch (e) {
console.error('delete fridge item failed:', pid, e);
}
}

onSaved?.();
} catch (e) {
console.error('save meal error', e);
alert("Impossible d’enregistrer le repas pour l’instant.");
}
};

return (
<div className="modalBackdrop" onClick={onClose}>
<div className="modalCard" onClick={(e) => e.stopPropagation()}>
<div className="modalHeader">
<h3>Ajouter un repas</h3>
<button className="modalClose" onClick={onClose}>×</button>
</div>

<div className="modalBody">
<div className="row">
<div className="field">
<label>Jour</label>
<select value={day} onChange={(e) => setDay(e.target.value)}>
{DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
</select>
</div>
<div className="field">
<label>Créneau</label>
<select value={slot} onChange={(e) => setSlot(e.target.value)}>
{SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
</select>
</div>
</div>

<div className="field">
<label>Nom du repas (facultatif)</label>
<input
placeholder="Ex : Salade de poulet"
value={name}
onChange={(e) => setName(e.target.value)}
/>
</div>

<div className="field">
<label>Produits du frigo</label>

{loading && <div className="muted">Chargement…</div>}
{!loading && loadError && (
<div className="error">{loadError}</div>
)}
{!loading && !loadError && products.length === 0 && (
<div className="muted">Aucun produit trouvé dans le frigo.</div>
)}

{!loading && !loadError && products.length > 0 && (
<div className="fridgeList">
{products.map((p) => (
<label key={p.id} className="checkRow">
<input
type="checkbox"
checked={selectedIds.includes(p.id)}
onChange={() => toggleId(p.id)}
/>
<span>{p.name}</span>
</label>
))}
</div>
)}
</div>
</div>

<div className="modalActions">
<button className="btnGhost" onClick={onClose}>Annuler</button>
<button className="btnPrimary" onClick={handleSave} disabled={!canSave}>
Sauvegarder
</button>
</div>
</div>
</div>
);
}
