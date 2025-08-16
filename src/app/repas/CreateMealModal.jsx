'use client';

import React, { useMemo, useState } from 'react';
import { auth, db } from '../firebase/firebase-config';
import { addDoc, collection } from 'firebase/firestore';

export default function CreateMealModal({ products, close }) {
const [name, setName] = useState('');
const [search, setSearch] = useState('');
const [selected, setSelected] = useState({}); // { [productId]: true }

const filtered = useMemo(() => {
const term = search.trim().toLowerCase();
if (!term) return products;
return products.filter((p) => (p.name || '').toLowerCase().includes(term));
}, [products, search]);

const toggle = (id) => setSelected((prev) => ({ ...prev, [id]: !prev[id] }));

const selectedItems = useMemo(
() =>
products
.filter((p) => selected[p.id])
.map((p) => ({ productId: p.id, name: p.name || 'Produit' })),
[products, selected]
);

const createMeal = async (e) => {
e.preventDefault();
const user = auth.currentUser;
if (!user) return alert("Tu n'es pas connecté.");
if (!name.trim()) return alert('Donne un nom au repas.');
if (selectedItems.length === 0) return alert('Choisis au moins un produit.');

try {
await addDoc(collection(db, 'users', user.uid, 'meals'), {
name: name.trim(),
items: selectedItems,
createdAt: new Date().toISOString(),
});
close();
} catch (err) {
console.error('create meal error:', err);
alert(`Erreur: ${err.code || ''} ${err.message || ''}`);
}
};

return (
<div className="modal-backdrop">
<div className="modal">
<h3>Composer un repas</h3>

<form onSubmit={createMeal}>
<label>Nom du repas</label>
<input
type="text"
placeholder="ex: Salade poulet-avocat"
value={name}
onChange={(e) => setName(e.target.value)}
/>

<label>Produits (depuis ton frigo)</label>
<input
type="text"
placeholder="Rechercher un produit…"
value={search}
onChange={(e) => setSearch(e.target.value)}
/>

{/* Bloc liste BLEU (styles dans globals.css) */}
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
{p.expirationDate && (
<span className="date">{p.expirationDate}</span>
)}
</li>
))
)}
</ul>
</div>

{/* Récap sélection */}
{selectedItems.length > 0 && (
<div style={{ marginTop: 10 }}>
<div style={{ fontSize: 13, color: '#3b3b3b', marginBottom: 6 }}>
{selectedItems.length} produit(s) sélectionné(s)
</div>
<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
{selectedItems.map((it) => (
<span key={it.productId} className="pill">
{it.name}
</span>
))}
</div>
</div>
)}

<div className="modal-actions">
<button type="button" className="ghostBtn" onClick={close}>
Annuler
</button>
<button className="primary" type="submit">
Enregistrer le repas
</button>
</div>
</form>
</div>
</div>
);
}
