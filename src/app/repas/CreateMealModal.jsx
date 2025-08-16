'use client';

import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase/firebase-config';
import { addDoc, collection, deleteDoc, doc, onSnapshot } from 'firebase/firestore';

export default function CreateMealModal({ closeModal, selectedDay }) {
const [name, setName] = useState('');
const [products, setProducts] = useState([]);
const [selected, setSelected] = useState([]);

useEffect(() => {
const user = auth.currentUser;
if (!user) return;
const ref = collection(db, "users", user.uid, "products");
const unsub = onSnapshot(ref, snap => {
setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
});
return () => unsub();
}, []);

function toggleProduct(p) {
if (selected.find(s => s.id === p.id)) {
setSelected(selected.filter(s => s.id !== p.id));
} else {
setSelected([...selected, p]);
}
}

async function onSubmit(e) {
e.preventDefault();
const user = auth.currentUser;
if (!user) return alert("Pas connecté");
if (!name.trim()) return alert("Nom du repas obligatoire");

// 1. Ajouter le repas
await addDoc(collection(db, "users", user.uid, "meals"), {
name: name.trim(),
day: selectedDay,
items: selected.map(p => ({ productId: p.id, name: p.name })),
createdAt: new Date().toISOString()
});

// 2. Supprimer les produits utilisés
for (const p of selected) {
await deleteDoc(doc(db, "users", user.uid, "products", p.id));
}

closeModal();
}

return (
<div className="modal-backdrop">
<div className="modal">
<h3>Créer un repas ({selectedDay})</h3>
<form onSubmit={onSubmit}>
<label>Nom du repas</label>
<input
type="text"
value={name}
onChange={e=>setName(e.target.value)}
placeholder="ex : Salade poulet"
/>

<label>Produits du frigo</label>
<div className="productListWrap">
<ul className="product-list">
{products.length === 0 && <li className="emptyRow">Aucun produit</li>}
{products.map(p => (
<li
key={p.id}
onClick={()=>toggleProduct(p)}
className={selected.find(s=>s.id===p.id) ? "is-selected" : ""}
>
<span className="name">{p.name}</span>
<span className="date">{p.expirationDate}</span>
</li>
))}
</ul>
</div>

<div className="modal-actions">
<button type="button" onClick={closeModal} className="ghostBtn">Annuler</button>
<button type="submit" className="primary">Créer</button>
</div>
</form>
</div>
</div>
);
}
