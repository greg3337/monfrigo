'use client';

import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase/firebase-config';
import { addDoc, collection, deleteDoc, doc, onSnapshot } from 'firebase/firestore';

export default function CreateMealModal({ selectedDay, close }) {
const [name, setName] = useState('');
const [products, setProducts] = useState([]); // produits du frigo
const [selected, setSelected] = useState({}); // { [productId]: true }
const [search, setSearch] = useState('');

// Charger les produits du frigo
useEffect(() => {
const u = auth.currentUser;
if (!u) return;
const ref = collection(db, 'users', u.uid, 'products');
const unsub = onSnapshot(ref, (snap) => {
const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
setProducts(list);
});
return () => unsub();
}, []);

const toggle = (id) => setSelected((prev) => ({ ...prev, [id]: !prev[id] }));

const filtered = products.filter((p) =>
(p.name || '').toLowerCase().includes(search.trim().toLowerCase())
);

const selectedItems = products
.filter((p) => !!selected[p.id])
.map((p) => ({ productId: p.id, name: p.name || 'Produit' }));

async function onSubmit(e) {
e.preventDefault();
const u = auth.currentUser;
if (!u) return alert("Tu n'es pas connecté.");
if (!name.trim()) return alert('Nom du repas obligatoire.');
if (selectedItems.length === 0) return alert('Sélectionne au moins un produit.');

// 1) créer le repas (sans jour spécifique ici)
await addDoc(collection(db, 'users', u.uid, 'meals'), {
name: name.trim(),
day: selectedDay || null,
items: selectedItems,
createdAt: new Date().toISOString(),
});

// 2) supprimer les produits utilisés du frigo
for (const it of selectedItems) {
await deleteDoc(doc(db, 'users', u.uid, 'products', it.productId));
}

close();
}

return (
<div className="modal-backdrop">
<div className="modal">
<h3>Composer un repas</h3>

<form onSubmit={onSubmit}>
<label>Nom du repas</label>
<input
type="text"
placeholder="ex : Pâtes thon-tomate"
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

{/* Bloc bleu (style défini dans globals.css) */}
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

{selectedItems.length > 0 && (
<div style={{ marginTop: 10 }}>
<div style={{ fontSize: 13, opacity: 0.8, marginBottom: 6 }}>
{selectedItems.length} produit(s) sélectionné(s)
</div>
<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
{selectedItems.map((it) => (
<span key={it.productId} className="pill">{it.name}</span>
))}
</div>
</div>
)}

<div className="modal-actions">
<button type="button" className="ghostBtn" onClick={close}>Annuler</button>
<button className="primary" type="submit">Enregistrer le repas</button>
</div>
</form>
</div>
</div>
);
}
