'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { auth, db } from '../firebase/firebase-config';
import {collection, query, onSnapshot, addDoc, deleteDoc, doc, where, updateDoc} from 'firebase/firestore';

function computeStatus(isoDate) {
if (!isoDate) return 'ok';
const today = new Date(); today.setHours(0,0,0,0);
const d = new Date(isoDate); d.setHours(0,0,0,0);
const diffDays = Math.ceil((d - today) / (1000*60*60*24));
if (diffDays < 0) return 'expired';
if (diffDays <= 2) return 'urgent';
return 'ok';
}

export default function CreateMealModal({
closeModal,
defaultDay,
defaultSlot,
editMeal = null, // si fourni => mode édition
onSaved = () => {}
}) {
const [user, setUser] = useState(null);
const [name, setName] = useState(editMeal?.name || '');
const [search, setSearch] = useState('');
const [selected, setSelected] = useState(editMeal?.products || []); // [{id,name,expirationDate,category,place}]
const [saving, setSaving] = useState(false);

// Charger les produits restants dans le frigo
const [products, setProducts] = useState([]);
useEffect(() => {
const unsub = auth.onAuthStateChanged(u => {
setUser(u || null);
if (!u) return;
const q = query(collection(db, 'users', u.uid, 'products'));
const unsubP = onSnapshot(q, snap => {
const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
setProducts(list);
});
return () => unsubP();
});
return () => unsub();
}, []);

// Liste affichée (filtrée)
const visible = useMemo(() => {
const q = search.trim().toLowerCase();
return products.filter(p => p.name?.toLowerCase().includes(q));
}, [products, search]);

const togglePick = (p) => {
const exists = selected.find(x => x.id === p.id);
if (exists) {
setSelected(prev => prev.filter(x => x.id !== p.id));
} else {
// on garde toutes les infos utiles pour restauration
setSelected(prev => [...prev, {
id: p.id,
name: p.name,
expirationDate: p.expirationDate || '',
category: p.category || 'autre',
place: p.place || 'frigo',
}]);
}
};

const onSubmit = async (e) => {
e.preventDefault();
if (!user) return;
if (!name.trim()) { alert('Nom de repas obligatoire'); return; }

setSaving(true);
try {
if (!editMeal) {
// ===== Création
const payload = {
day: defaultDay,
slot: defaultSlot,
name: name.trim(),
products: selected,
createdAt: new Date().toISOString(),
};
const mealRef = await addDoc(collection(db, 'users', user.uid, 'meals'), payload);

// supprimer du frigo les produits utilisés
for (const p of selected) {
await deleteDoc(doc(db, 'users', user.uid, 'products', p.id));
}
} else {
// ===== Édition
const mealRef = doc(db, 'users', user.uid, 'meals', editMeal.id);

// 1) restituer anciens produits au frigo (ceux qui ne sont plus dans la sélection)
const old = Array.isArray(editMeal.products) ? editMeal.products : [];
const keepIds = new Set(selected.map(p => p.id));
const toRestore = old.filter(p => !keepIds.has(p.id));
for (const p of toRestore) {
await addDoc(collection(db, 'users', user.uid, 'products'), {
name: p.name,
expirationDate: p.expirationDate || '',
category: p.category || 'autre',
place: p.place || 'frigo',
status: computeStatus(p.expirationDate || ''),
createdAt: new Date().toISOString(),
});
}

// 2) supprimer du frigo les nouveaux produits ajoutés (qui n’étaient pas dans l’ancien repas)
const oldIds = new Set(old.map(p => p.id));
const newlyUsed = selected.filter(p => !oldIds.has(p.id));
for (const p of newlyUsed) {
await deleteDoc(doc(db, 'users', user.uid, 'products', p.id));
}

// 3) update du repas
await updateDoc(mealRef, {
day: defaultDay,
slot: defaultSlot,
name: name.trim(),
products: selected,
updatedAt: new Date().toISOString(),
});
}

onSaved();
closeModal();
} catch (err) {
console.error('save meal error:', err);
alert("Erreur lors de l’enregistrement du repas.");
} finally {
setSaving(false);
}
};

return (
<div className="modal-backdrop">
<div className="modal">
<h3>{editMeal ? 'Modifier le repas' : 'Composer un repas'}</h3>

<form onSubmit={onSubmit}>
<label>Nom du repas</label>
<input
type="text"
placeholder="ex : Pâtes thon-tomate"
value={name}
onChange={e => setName(e.target.value)}
/>

<label>Produits (depuis ton frigo)</label>
<input
className="search"
placeholder="Rechercher un produit…"
value={search}
onChange={e => setSearch(e.target.value)}
/>

<div className="productListWrap">
<ul className="product-list">
{visible.length === 0 && <li className="emptyRow">Aucun produit</li>}
{visible.map(p => {
const isSel = selected.some(x => x.id === p.id);
return (
<li
key={p.id}
className={isSel ? 'is-selected' : ''}
onClick={() => togglePick(p)}
>
<span className="name">{p.name}</span>
{p.expirationDate && <span className="date">{p.expirationDate}</span>}
</li>
);
})}
</ul>
</div>

<div className="modal-actions">
<button type="button" className="ghostBtn" onClick={closeModal}>Annuler</button>
<button className="primary" type="submit" disabled={saving}>
{saving ? 'Enregistrement…' : (editMeal ? 'Mettre à jour' : 'Enregistrer le repas')}
</button>
</div>
</form>
</div>
</div>
);
}
