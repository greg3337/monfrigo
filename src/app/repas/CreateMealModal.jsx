'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { auth, db } from '../firebase/firebase-config';
import {collection, onSnapshot, query, orderBy,writeBatch, doc, serverTimestamp} from 'firebase/firestore';
import './repas.css';

export default function CreateMealModal({ closeModal, defaultDay='Lundi', defaultSlot='Déjeuner' }) {
const [title, setTitle] = useState('');
const [day, setDay] = useState(defaultDay);
const [slot, setSlot] = useState(defaultSlot);

const [products, setProducts] = useState([]);
const [search, setSearch] = useState('');
const [selected, setSelected] = useState(() => new Set());
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);

// Charger produits du frigo
useEffect(() => {
const u = auth.currentUser;
if (!u) return;
const q = query(collection(db, 'users', u.uid, 'products'), orderBy('name'));
const unsub = onSnapshot(q, (snap) => {
setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
setLoading(false);
}, () => setLoading(false));
return () => unsub();
}, []);

const filtered = useMemo(() => {
const q = search.trim().toLowerCase();
if (!q) return products;
return products.filter(p =>
p.name?.toLowerCase().includes(q) ||
p.category?.toLowerCase().includes(q) ||
p.place?.toLowerCase().includes(q)
);
}, [products, search]);

const toggleSelect = (id) => {
setSelected(prev => {
const next = new Set(prev);
next.has(id) ? next.delete(id) : next.add(id);
return next;
});
};

async function saveMeal(e) {
e.preventDefault();
const u = auth.currentUser;
if (!u) { alert("Tu n'es pas connecté."); return; }

const picked = products.filter(p => selected.has(p.id));
if (picked.length === 0) { alert('Sélectionne au moins un produit.'); return; }

const mealTitle = title.trim() || picked.map(p => p.name).filter(Boolean).join(' + ').slice(0,80) || 'Repas';

setSaving(true);
try {
const batch = writeBatch(db);
const mealRef = doc(collection(db, 'users', u.uid, 'meals'));
batch.set(mealRef, {
name: mealTitle,
day,
slot,
products: picked.map(({ id, name, expirationDate, category, place }) => ({
id, name: name || '', expirationDate: expirationDate || '', category: category || '', place: place || ''
})),
createdAt: serverTimestamp(),
});
// Consommer (supprimer) les produits choisis du frigo
picked.forEach(p => batch.delete(doc(db, 'users', u.uid, 'products', p.id)));

await batch.commit();
closeModal();
} catch (err) {
console.error('saveMeal error:', err);
alert(`Erreur: ${err.message || err.code}`);
} finally {
setSaving(false);
}
}

return (
<div className="modalOverlay" onClick={closeModal}>
<div className="modalContent" onClick={e => e.stopPropagation()}>
<h2>Composer un repas</h2>

<label>Nom du repas</label>
<input
type="text"
value={title}
placeholder="ex : Salade poulet-avocat"
onChange={e => setTitle(e.target.value)}
/>

<div style={{ display:'flex', gap:8 }}>
<div style={{ flex:1 }}>
<label>Jour</label>
<select value={day} onChange={e => setDay(e.target.value)}>
{['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'].map(d => (
<option key={d} value={d}>{d}</option>
))}
</select>
</div>
<div style={{ flex:1 }}>
<label>Créneau</label>
<select value={slot} onChange={e => setSlot(e.target.value)}>
{['Petit-déjeuner','Déjeuner','Dîner','Goûter'].map(s => (
<option key={s} value={s}>{s}</option>
))}
</select>
</div>
</div>

<label>Produits du frigo</label>
<input
type="text"
placeholder="Rechercher un produit…"
value={search}
onChange={e => setSearch(e.target.value)}
/>

<div className="productListWrap" style={{ marginTop:8 }}>
{loading ? (
<div className="product-list emptyRow">Chargement…</div>
) : filtered.length === 0 ? (
<div className="product-list emptyRow">Aucun produit</div>
) : (
<ul className="product-list">
{filtered.map(p => {
const isSel = selected.has(p.id);
return (
<li key={p.id} className={isSel ? 'is-selected' : ''} onClick={() => toggleSelect(p.id)}>
<input type="checkbox" readOnly checked={isSel} style={{ pointerEvents:'none' }}/>
<span className="name">{p.name || '(sans nom)'}</span>
{p.expirationDate && <span className="date">{p.expirationDate}</span>}
</li>
);
})}
</ul>
)}
</div>

<div className="modalActions" style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:12 }}>
<button className="btnSecondary" type="button" onClick={closeModal}>Annuler</button>
<button className="btnPrimary" type="button" onClick={saveMeal} disabled={saving}>
{saving ? 'Enregistrement…' : 'Enregistrer le repas'}
</button>
</div>
</div>
</div>
);
}
