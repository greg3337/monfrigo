'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { auth, db } from './firebase/firebase-config';
import {addDoc,collection,deleteDoc,doc,onSnapshot,orderBy,query,} from 'firebase/firestore';

const DAYS = ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];

export default function CreateMealModal({ closeModal }) {
const [name, setName] = useState('');
const [day, setDay] = useState(DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay()-1]); // map JS->FR
const [slot, setSlot] = useState('midi'); // midi | soir

const [products, setProducts] = useState([]);
const [selected, setSelected] = useState({}); // { [id]: true }
const [search, setSearch] = useState('');
const [saving, setSaving] = useState(false);

// Charge les produits du frigo
useEffect(() => {
const u = auth.currentUser;
if (!u) return;
const q = query(
collection(db, 'users', u.uid, 'products'),
orderBy('expirationDate', 'asc')
);
const unsub = onSnapshot(q, snap => {
const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
setProducts(list);
});
return () => unsub();
}, []);

const visible = useMemo(() => {
const q = search.trim().toLowerCase();
if (!q) return products;
return products.filter(p =>
p.name?.toLowerCase().includes(q)
);
}, [products, search]);

const toggle = (id) => {
setSelected(prev => ({ ...prev, [id]: !prev[id] }));
};

async function onSave(e) {
e.preventDefault();
const u = auth.currentUser;
if (!u) { alert("Connecte-toi."); return; }
if (!name.trim()) { alert('Nom du repas obligatoire'); return; }

const chosen = products.filter(p => selected[p.id]);
if (chosen.length === 0) { alert('Sélectionne au moins un produit'); return; }

setSaving(true);
try {
// Crée le repas
await addDoc(collection(db, 'users', u.uid, 'meals'), {
name: name.trim(),
day,
slot, // "midi" | "soir"
products: chosen.map(p => ({ id: p.id, name: p.name, expirationDate: p.expirationDate || null })),
createdAt: new Date().toISOString(),
});

// Supprime les produits du frigo (consommés)
for (const p of chosen) {
await deleteDoc(doc(db, 'users', u.uid, 'products', p.id));
}

closeModal();
} catch (err) {
console.error(err);
alert(`Erreur lors de l'enregistrement du repas : ${err.message || err}`);
} finally {
setSaving(false);
}
}

return (
<div className="modal-backdrop">
<div className="modal">
<h3>Composer un repas</h3>

<form onSubmit={onSave}>
<label>Nom du repas</label>
<input
type="text"
placeholder="ex : Pâtes thon-tomate"
value={name}
onChange={e => setName(e.target.value)}
/>

<div className="row" style={{ display:'flex', gap: 8 }}>
<div style={{ flex: 1 }}>
<label>Jour</label>
<select value={day} onChange={e => setDay(e.target.value)}>
{DAYS.map(d => <option key={d} value={d}>{d}</option>)}
</select>
</div>
<div style={{ flex: 1 }}>
<label>Moment</label>
<select value={slot} onChange={e => setSlot(e.target.value)}>
<option value="midi">Midi</option>
<option value="soir">Soir</option>
</select>
</div>
</div>

<label>Produits (depuis ton frigo)</label>
<input
type="text"
placeholder="Rechercher un produit…"
value={search}
onChange={e => setSearch(e.target.value)}
/>

<div className="productListWrap">
<ul className="product-list">
{visible.length === 0 && (
<li className="emptyRow">Aucun produit</li>
)}
{visible.map(p => {
const isSel = !!selected[p.id];
return (
<li
key={p.id}
className={isSel ? 'is-selected' : ''}
onClick={() => toggle(p.id)}
title="Sélectionner / désélectionner"
>
<span className="name">{p.name}</span>
{p.expirationDate && (
<span className="date">{p.expirationDate}</span>
)}
</li>
);
})}
</ul>
</div>

<div className="modal-actions">
<button type="button" className="ghostBtn" onClick={closeModal}>Annuler</button>
<button className="primary" type="submit" disabled={saving}>
{saving ? 'Enregistrement…' : 'Enregistrer le repas'}
</button>
</div>
</form>
</div>
</div>
);
}
