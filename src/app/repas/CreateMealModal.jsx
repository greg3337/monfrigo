'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
collection,
onSnapshot,
addDoc,
serverTimestamp,
writeBatch,
doc,
query,
orderBy,
} from 'firebase/firestore';
import { auth, db } from '../firebase/firebase-config'; // <- chemin correct depuis /repas/

const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const SLOTS = ['Petit-déjeuner','Déjeuner','Dîner','Goûter'];

export default function CreateMealModal({ closeModal, defaultDay = 'Lundi', defaultSlot = 'Déjeuner' }) {
const [day, setDay] = useState(defaultDay);
const [slot, setSlot] = useState(defaultSlot);
const [name, setName] = useState('');
const [products, setProducts] = useState([]);
const [selectedIds, setSelectedIds] = useState([]); // ids produits sélectionnés
const [saving, setSaving] = useState(false);
const u = auth.currentUser;

// Charger les produits du frigo
useEffect(() => {
if (!u) return;
const qRef = query(
collection(db, 'users', u.uid, 'products'),
orderBy('expirationDate', 'asc')
);
const unsub = onSnapshot(qRef, (snap) => {
const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
setProducts(rows);
});
return () => unsub();
}, [u]);

const selectedProducts = useMemo(
() => products.filter(p => selectedIds.includes(p.id)),
[products, selectedIds]
);

async function handleSave(e) {
e.preventDefault();
if (!u) return;
if (!name.trim()) return alert('Entre un nom de repas.');
setSaving(true);

try {
// 1) créer le repas
const mealRef = collection(db, 'users', u.uid, 'meals');
const payload = {
day,
slot,
name: name.trim(),
productIds: selectedIds,
productNames: selectedProducts.map(p => p.name),
createdAt: serverTimestamp(),
};

// 2) préparer la suppression des produits sélectionnés
const batch = writeBatch(db);
// ajouter le repas
await addDoc(mealRef, payload);
// supprimer chaque produit choisi du frigo
selectedIds.forEach((pid) => {
const pDoc = doc(db, 'users', u.uid, 'products', pid);
batch.delete(pDoc);
});

await batch.commit();

// fini
closeModal?.();
} catch (err) {
console.error(err);
alert("Impossible d'enregistrer le repas.");
} finally {
setSaving(false);
}
}

function toggleProduct(id) {
setSelectedIds(prev =>
prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
);
}

return (
<div className="modal" role="dialog" aria-modal="true" aria-label="Créer un repas">
<h3 style={{marginBottom: 10}}>Créer un repas</h3>

<form onSubmit={handleSave} className="modalForm">
{/* Jour & créneau */}
<div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:10}}>
<label>
Jour&nbsp;
<select value={day} onChange={e=>setDay(e.target.value)}>
{DAYS.map(d => <option key={d} value={d}>{d}</option>)}
</select>
</label>

<label>
Créneau&nbsp;
<select value={slot} onChange={e=>setSlot(e.target.value)}>
{SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
</select>
</label>

<label style={{flex: '1 1 220px'}}>
Nom du repas&nbsp;
<input
value={name}
onChange={e=>setName(e.target.value)}
placeholder="Ex : Salade de poulet"
/>
</label>
</div>

{/* Produits du frigo (multi) */}
<div>
<div style={{fontWeight:600, marginBottom:6}}>Produits du frigo</div>
{products.length === 0 ? (
<div style={{opacity:.7}}>Aucun produit dans le frigo</div>
) : (
<ul className="product-list" style={{maxHeight:260, overflow:'auto', padding:0}}>
{products.map(p => (
<li key={p.id}
className={selectedIds.includes(p.id) ? 'is-selected' : ''}
onClick={()=>toggleProduct(p.id)}
style={{listStyle:'none', display:'flex', gap:8, alignItems:'center',
padding:'8px 10px', margin:'6px 0', background:'#fff',
borderRadius:8, cursor:'pointer'}}>
<input
type="checkbox"
checked={selectedIds.includes(p.id)}
readOnly
/>
<span className="name" style={{fontWeight:600}}>{p.name}</span>
{p.expirationDate && (
<span className="date" style={{marginLeft:'auto', fontSize:12, opacity:.7}}>
{p.expirationDate}
</span>
)}
</li>
))}
</ul>
)}
</div>

{/* Actions */}
<div style={{display:'flex', gap:8, marginTop:12}}>
<button type="button" className="btnGhost" onClick={()=>closeModal?.()}>
Annuler
</button>
<button type="submit" className="btnPrimary" disabled={saving}>
{saving ? 'Enregistrement…' : 'Enregistrer'}
</button>
</div>
</form>
</div>
);
}
