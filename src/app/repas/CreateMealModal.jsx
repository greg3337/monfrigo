'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { auth, db } from '../firebase/firebase-config';
import {
collection,
onSnapshot,
query,
orderBy,
writeBatch,
doc,
setDoc,
serverTimestamp,
} from 'firebase/firestore';

export default function CreateMealModal({
closeModal,
defaultDay = 'Lundi',
defaultSlot = 'Déjeuner',
}) {
// Champs du repas
const [title, setTitle] = useState('');
const [day, setDay] = useState(defaultDay);
const [slot, setSlot] = useState(defaultSlot);

// Produits du frigo
const [products, setProducts] = useState([]);
const [search, setSearch] = useState('');
const [selected, setSelected] = useState(() => new Set());

const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);

// Charge les produits du frigo de l'utilisateur
useEffect(() => {
const u = auth.currentUser;
if (!u) return;

const q = query(
collection(db, 'users', u.uid, 'products'),
orderBy('expirationDate', 'asc')
);

const unsub = onSnapshot(
q,
(snap) => {
const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
setProducts(list);
setLoading(false);
},
(err) => {
console.error('load products error', err);
setLoading(false);
}
);

return () => unsub();
}, []);

// Filtre recherche
const filtered = useMemo(() => {
const q = search.trim().toLowerCase();
if (!q) return products;
return products.filter(
(p) =>
p.name?.toLowerCase().includes(q) ||
p.category?.toLowerCase().includes(q) ||
p.place?.toLowerCase().includes(q)
);
}, [products, search]);

// Sélection / désélection
function toggleSelect(id) {
setSelected((prev) => {
const next = new Set(prev);
if (next.has(id)) next.delete(id);
else next.add(id);
return next;
});
}

// Enregistrement : crée un repas + supprime les produits sélectionnés
async function saveMeal(e) {
e.preventDefault();
const u = auth.currentUser;
if (!u) {
alert("Tu n'es pas connecté.");
return;
}
if (selected.size === 0) {
alert('Sélectionne au moins un produit.');
return;
}

const picked = products.filter((p) => selected.has(p.id));

// Titre automatique si vide
const mealTitle =
title.trim() ||
picked
.map((p) => p.name)
.filter(Boolean)
.join(' + ')
.slice(0, 80) || 'Repas';

setSaving(true);
try {
const batch = writeBatch(db);

// on crée un id de doc pour setDoc (compatible writeBatch)
const mealRef = doc(collection(db, 'users', u.uid, 'meals'));
batch.set(mealRef, {
title: mealTitle,
day,
slot,
products: picked.map(({ id, name, expirationDate, category, place }) => ({
id,
name: name || '',
expirationDate: expirationDate || '',
category: category || '',
place: place || '',
})),
createdAt: serverTimestamp(),
});

// suppression des produits consommés
picked.forEach((p) => {
const pref = doc(db, 'users', u.uid, 'products', p.id);
batch.delete(pref);
});

await batch.commit();

// reset & fermer
setTitle('');
setSelected(new Set());
closeModal();
} catch (err) {
console.error('saveMeal error:', err);
alert(`Erreur lors de la création du repas: ${err.code || ''} ${err.message || ''}`);
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
value={title}
onChange={(e) => setTitle(e.target.value)}
/>

<div className="row" style={{ display: 'flex', gap: 8 }}>
<div style={{ flex: 1 }}>
<label>Jour</label>
<select value={day} onChange={(e) => setDay(e.target.value)}>
{['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'].map((d) => (
<option key={d} value={d}>{d}</option>
))}
</select>
</div>
<div style={{ flex: 1 }}>
<label>Créneau</label>
<select value={slot} onChange={(e) => setSlot(e.target.value)}>
{['Petit-déjeuner','Déjeuner','Dîner','Goûter'].map((s) => (
<option key={s} value={s}>{s}</option>
))}
</select>
</div>
</div>

<label>Produits (depuis ton frigo)</label>
<input
type="text"
className="search"
placeholder="Rechercher un produit…"
value={search}
onChange={(e) => setSearch(e.target.value)}
/>

<div className="productListWrap">
{loading ? (
<div className="product-list emptyRow">Chargement…</div>
) : filtered.length === 0 ? (
<div className="product-list emptyRow">Aucun produit</div>
) : (
<ul className="product-list">
{filtered.map((p) => {
const isSel = selected.has(p.id);
return (
<li
key={p.id}
className={isSel ? 'is-selected' : ''}
onClick={() => toggleSelect(p.id)}
title="Sélectionner / désélectionner"
>
<input
type="checkbox"
checked={isSel}
readOnly
style={{ pointerEvents: 'none' }}
/>
<span className="name">{p.name || '(sans nom)'}</span>
{p.expirationDate && (
<span className="date">{p.expirationDate}</span>
)}
</li>
);
})}
</ul>
)}
</div>

<div className="modal-actions" style={{ marginTop: 12, display: 'flex', gap: 8 }}>
<button type="button" className="ghostBtn" onClick={closeModal}>
Annuler
</button>
<button type="submit" className="primary" disabled={saving}>
{saving ? 'Enregistrement…' : 'Enregistrer le repas'}
</button>
</div>
</form>
</div>
</div>
);
}
