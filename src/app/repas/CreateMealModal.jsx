'use client';

import React, { useMemo, useState } from 'react';
import { auth, db } from '../firebase/firebase-config';
import { addDoc, collection } from 'firebase/firestore';

export default function CreateMealModal({ products, close }) {
const [name, setName] = useState('');
const [search, setSearch] = useState('');
const [selected, setSelected] = useState({}); // { productId: true }

const filtered = useMemo(() => {
const term = search.trim().toLowerCase();
if (!term) return products;
return products.filter((p) => (p.name || '').toLowerCase().includes(term));
}, [products, search]);

const toggle = (id) => {
setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
};

const selectedItems = useMemo(() => {
return products
.filter((p) => selected[p.id])
.map((p) => ({ productId: p.id, name: p.name || 'Ingrédient' }));
}, [products, selected]);

const createMeal = async (e) => {
e.preventDefault();
const user = auth.currentUser;
if (!user) {
alert("Tu n'es pas connecté.");
return;
}
if (!name.trim()) {
alert('Donne un nom au repas (ex: Poulet curry)');
return;
}
if (selectedItems.length === 0) {
alert('Choisis au moins un ingrédient.');
return;
}

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

<label>Ingrédients (depuis ton frigo)</label>
<input
type="text"
placeholder="Rechercher un produit…"
value={search}
onChange={(e) => setSearch(e.target.value)}
/>

<div
style={{
maxHeight: 260,
overflow: 'auto',
border: '1px solid #2a2d34',
borderRadius: 10,
padding: 8,
marginTop: 6,
background: '#16181d',
}}
>
{filtered.length === 0 && (
<div style={{ color: '#aaa', padding: 8 }}>Aucun produit</div>
)}
{filtered.map((p) => (
<label
key={p.id}
style={{
display: 'flex',
alignItems: 'center',
gap: 8,
padding: '6px 4px',
color: 'white',
cursor: 'pointer',
}}
>
<input
type="checkbox"
checked={!!selected[p.id]}
onChange={() => toggle(p.id)}
/>
<span>{p.name}</span>
{p.expirationDate && (
<span
style={{
marginLeft: 'auto',
fontSize: 12,
opacity: 0.8,
}}
>
{p.expirationDate}
</span>
)}
</label>
))}
</div>

{/* Récap sélection */}
{selectedItems.length > 0 && (
<div style={{ marginTop: 10 }}>
<div style={{ fontSize: 13, color: '#cfcfcf', marginBottom: 6 }}>
{selectedItems.length} ingrédient(s) sélectionné(s)
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
