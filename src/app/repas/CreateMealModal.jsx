'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase/firebase-config';
import {
collection,
doc,
onSnapshot,
Timestamp,
writeBatch,
} from 'firebase/firestore';

const JOURS = ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];
const MOMENTS = ['midi','soir'];

export default function CreateMealModal({ onClose }) {
const [user, setUser] = useState(null);
const [name, setName] = useState('');
const [day, setDay] = useState('lundi');
const [moment, setMoment] = useState('midi');

const [products, setProducts] = useState([]); // produits du frigo
const [search, setSearch] = useState('');
const [selected, setSelected] = useState({}); // { [productId]: true }
const [saving, setSaving] = useState(false);

// Auth
useEffect(() => {
const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
return () => unsub();
}, []);

// Charger les produits du frigo (temps réel)
useEffect(() => {
if (!user) return;
const ref = collection(db, 'users', user.uid, 'products');
const unsub = onSnapshot(ref, (snap) => {
const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
setProducts(list);
});
return () => unsub();
}, [user]);

const filtered = useMemo(() => {
const q = search.trim().toLowerCase();
if (!q) return products;
return products.filter((p) => (p.name || '').toLowerCase().includes(q));
}, [products, search]);

const selectedItems = useMemo(
() => products.filter((p) => !!selected[p.id]),
[products, selected]
);

const toggle = (id) => setSelected((prev) => ({ ...prev, [id]: !prev[id] }));

async function saveMeal(e) {
e.preventDefault();
if (!user) return alert("Tu n'es pas connecté.");
if (!name.trim()) return alert('Nom du repas obligatoire.');
if (selectedItems.length === 0) return alert('Sélectionne au moins un produit.');

setSaving(true);
try {
// Doc du repas
const mealsCol = collection(db, 'users', user.uid, 'meals');
const mealRef = doc(mealsCol); // id auto
const mealData = {
name: name.trim(),
day,
moment,
items: selectedItems.map((p) => ({
productId: p.id,
name: p.name || '',
expirationDate: p.expirationDate || null,
})),
createdAt: Timestamp.now(),
};

// Batch: créer repas + supprimer produits utilisés
const batch = writeBatch(db);
batch.set(mealRef, mealData);
selectedItems.forEach((p) => {
batch.delete(doc(db, 'users', user.uid, 'products', p.id));
});

await batch.commit();
onClose?.();
} catch (err) {
console.error('saveMeal batch error:', err);
alert("Erreur lors de l'enregistrement du repas.");
} finally {
setSaving(false);
}
}

return (
<div className="modal-backdrop">
<div className="modal">
<h3>Composer un repas</h3>

<form onSubmit={saveMeal}>
<label>Nom du repas</label>
<input
type="text"
placeholder="ex : Pâtes thon-tomate"
value={name}
onChange={(e) => setName(e.target.value)}
/>

<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
<div>
<label>Jour</label>
<select value={day} onChange={(e) => setDay(e.target.value)}>
{JOURS.map((j) => (
<option key={j} value={j}>{j.charAt(0).toUpperCase()+j.slice(1)}</option>
))}
</select>
</div>
<div>
<label>Moment</label>
<select value={moment} onChange={(e) => setMoment(e.target.value)}>
{MOMENTS.map((m) => (
<option key={m} value={m}>{m.charAt(0).toUpperCase()+m.slice(1)}</option>
))}
</select>
</div>
</div>

<label>Produits (depuis ton frigo)</label>
<input
type="text"
placeholder="Rechercher un produit…"
value={search}
onChange={(e) => setSearch(e.target.value)}
/>

{/* Bloc bleu (styles déjà dans globals.css) */}
<div className="productListWrap">
<ul className="product-list">
{filtered.length === 0 ? (
<li className="emptyRow">Aucun produit</li>
) : (
filtered.map((p) => (
<li
key={p.id}
className={selected[p.id] ? 'is-selected' : ''}
onClick={() => toggle(p.id)}
>
<input type="checkbox" checked={!!selected[p.id]} readOnly />
<span className="name">{p.name}</span>
{p.expirationDate && <span className="date">{p.expirationDate}</span>}
</li>
))
)}
</ul>
</div>

<div className="modal-actions">
<button type="button" className="ghostBtn" onClick={onClose}>Annuler</button>
<button className="primary" type="submit" disabled={saving}>
{saving ? 'Enregistrement…' : 'Enregistrer le repas'}
</button>
</div>
</form>
</div>
</div>
);
}
