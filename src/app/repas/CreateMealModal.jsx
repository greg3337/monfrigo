'use client';

import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase/firebase-config';
import {
addDoc,
collection,
Timestamp,
query,
where,
onSnapshot,
doc,
deleteDoc,
} from 'firebase/firestore';

const SLOTS = ['Déjeuner', 'Dîner'];
const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];

export default function CreateMealModal({ defaultDay, defaultSlot, onClose }) {
const [userId, setUserId] = useState(null);

const [day, setDay] = useState(defaultDay || 'Lundi');
const [slot, setSlot] = useState(defaultSlot || 'Déjeuner');
const [name, setName] = useState('');
const [products, setProducts] = useState([]); // produits du frigo
const [selectedIds, setSelectedIds] = useState([]); // ids sélectionnés
const [saving, setSaving] = useState(false);

// auth
useEffect(() => {
const unsub = auth.onAuthStateChanged((u) => setUserId(u ? u.uid : null));
return () => unsub();
}, []);

// Charger les produits du frigo
useEffect(() => {
if (!userId) return;
const q = query(collection(db, 'fridge'), where('userId', '==', userId));
const unsub = onSnapshot(q, (snap) => {
const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
setProducts(rows);
});
return () => unsub();
}, [userId]);

const togglePick = (id) => {
setSelectedIds((prev) =>
prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
);
};

const handleSave = async () => {
if (!userId) return;
if (selectedIds.length === 0 && !name.trim()) {
alert('Ajoute un nom ou sélectionne au moins un produit.');
return;
}
setSaving(true);
try {
const picked = products
.filter((p) => selectedIds.includes(p.id))
.map((p) => ({ id: p.id, name: p.name || p.label || 'Produit' }));

await addDoc(collection(db, 'meals'), {
userId,
day,
slot,
name: name.trim(),
products: picked,
createdAt: Timestamp.now(),
});

// Supprimer du frigo les produits utilisés
for (const id of selectedIds) {
await deleteDoc(doc(db, 'fridge', id));
}

onClose?.();
} catch (e) {
console.error('save meal error', e);
alert("Impossible d'enregistrer le repas.");
} finally {
setSaving(false);
}
};

return (
<div className="modalBack" role="dialog" aria-modal="true" aria-label="Ajouter un repas">
<div className="modalCard">
<header className="modalHead">
<h4>Ajouter un repas</h4>
<button className="btnGhost" onClick={onClose}>×</button>
</header>

<div className="modalBody">
<div className="row">
<label>
Jour
<select value={day} onChange={(e) => setDay(e.target.value)}>
{DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
</select>
</label>

<label>
Créneau
<select value={slot} onChange={(e) => setSlot(e.target.value)}>
{SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
</select>
</label>
</div>

<label className="row full">
Nom du repas (facultatif)
<input
type="text"
placeholder="Ex : Salade de poulet"
value={name}
onChange={(e) => setName(e.target.value)}
/>
</label>

<div className="pickerBlock">
<div className="pickerHead">Produits du frigo</div>
{products.length === 0 ? (
<p className="muted">Aucun produit dans le frigo.</p>
) : (
<ul className="productPickList">
{products.map((p) => {
const checked = selectedIds.includes(p.id);
return (
<li key={p.id}>
<label className="pick">
<input
type="checkbox"
checked={checked}
onChange={() => togglePick(p.id)}
/>
<span className="pickName">{p.name || 'Produit'}</span>
{p.expirationDate && (
<span className="pickMeta">{p.expirationDate}</span>
)}
</label>
</li>
);
})}
</ul>
)}
</div>
</div>

<footer className="modalFoot">
<button className="btnPrimary" onClick={handleSave} disabled={saving}>
{saving ? 'Sauvegarde…' : 'Sauvegarder'}
</button>
<button className="btnGhost" onClick={onClose}>Annuler</button>
</footer>
</div>
</div>
);
}
