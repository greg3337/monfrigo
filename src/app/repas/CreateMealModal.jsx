'use client';

import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase/firebase-config';
import {
collection,
getDocs,
writeBatch,
doc,
Timestamp,
} from 'firebase/firestore';

export default function CreateMealModal({ onClose }) {
const [name, setName] = useState('');
const [products, setProducts] = useState([]);
const [selectedIds, setSelectedIds] = useState(new Set());

// Charger les produits du frigo
useEffect(() => {
const loadProducts = async () => {
const user = auth.currentUser;
if (!user) return;
const snap = await getDocs(collection(db, 'users', user.uid, 'products'));
setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
};
loadProducts();
}, []);

const toggleSelect = (id) => {
setSelectedIds(prev => {
const n = new Set(prev);
n.has(id) ? n.delete(id) : n.add(id);
return n;
});
};

// Sauvegarder le repas
async function saveMeal() {
const user = auth.currentUser;
if (!user) return alert("Tu n'es pas connecté.");
if (!name.trim()) return alert('Donne un nom à ton repas.');
if (!selectedIds.size) return alert('Sélectionne au moins un produit.');

const picked = products.filter(p => selectedIds.has(p.id));

// 1) Doc repas
const mealsCol = collection(db, 'users', user.uid, 'meals');
const mealRef = doc(mealsCol);
const mealData = {
name: name.trim(),
items: picked.map(p => ({
id: p.id,
name: p.name || '',
expirationDate: p.expirationDate || null,
})),
createdAt: Timestamp.now(),
};

// 2) Batch repas + suppression produits
const batch = writeBatch(db);
batch.set(mealRef, mealData);
picked.forEach(p => {
const prodRef = doc(db, 'users', user.uid, 'products', p.id);
batch.delete(prodRef);
});

try {
await batch.commit();
onClose?.();
} catch (e) {
console.error('saveMeal error:', e);
alert("Erreur lors de l'enregistrement du repas.");
}
}

return (
<div className="modal">
<h2>Composer un repas</h2>
<input
type="text"
placeholder="Nom du repas (ex : Pâtes thon-tomate)"
value={name}
onChange={e => setName(e.target.value)}
/>

<h3>Produits (depuis ton frigo)</h3>
{products.length === 0 ? (
<p>Aucun produit</p>
) : (
<ul>
{products.map(p => (
<li key={p.id}>
<label>
<input
type="checkbox"
checked={selectedIds.has(p.id)}
onChange={() => toggleSelect(p.id)}
/>
{p.name}
</label>
</li>
))}
</ul>
)}

<div style={{ marginTop: 12 }}>
<button onClick={onClose}>Annuler</button>
<button className="primary" onClick={saveMeal}>Enregistrer le repas</button>
</div>
</div>
);
}
