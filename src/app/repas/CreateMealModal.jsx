'use client';

import React, {useEffect, useState} from 'react';
import { auth } from '../firebase/firebase-config';
import { db } from '../firebase/firebase-config';
import {
collection, query, where, getDocs,
addDoc, serverTimestamp, writeBatch, doc
} from 'firebase/firestore';

const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const SLOTS = ['Déjeuner','Dîner'];

export default function CreateMealModal({ defaultDay='Lundi', defaultSlot='Déjeuner', onClose, onSaved }) {
const [day, setDay] = useState(defaultDay);
const [slot, setSlot] = useState(defaultSlot);
const [name, setName] = useState('');
const [loading, setLoading] = useState(false);
const [fridgeItems, setFridgeItems] = useState([]);
const [selectedIds, setSelectedIds] = useState(new Set());
const [error, setError] = useState('');

// Charge les produits du frigo de l'utilisateur connecté
useEffect(() => {
const loadFridge = async () => {
setError('');
setFridgeItems([]);
const user = auth.currentUser;
if (!user) return;

try {
// Chemin: users/{uid}/fridge
const colRef = collection(db, 'users', user.uid, 'fridge');
const snap = await getDocs(colRef);
const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
setFridgeItems(items);
} catch (e) {
console.error('Fridge read error:', e);
setError('Impossible de charger les produits du frigo.');
}
};
loadFridge();
}, []);

const toggleItem = (id) => {
setSelectedIds(prev => {
const next = new Set(prev);
next.has(id) ? next.delete(id) : next.add(id);
return next;
});
};

const saveMeal = async () => {
const user = auth.currentUser;
if (!user) return;
setLoading(true);
setError('');

try {
// 1) créer le repas
await addDoc(collection(db, 'users', user.uid, 'meals'), {
day, slot,
name: name.trim() || null,
products: fridgeItems.filter(it => selectedIds.has(it.id)).map(it => ({
id: it.id, name: it.name ?? it.nom ?? 'Produit'
})),
createdAt: serverTimestamp()
});

// 2) supprimer du frigo les produits sélectionnés
if (selectedIds.size > 0) {
const batch = writeBatch(db);
selectedIds.forEach(id => {
batch.delete(doc(db, 'users', user.uid, 'fridge', id));
});
await batch.commit();
}

onSaved?.();
onClose?.();
} catch (e) {
console.error('Save meal error:', e);
setError("Impossible d'enregistrer le repas.");
} finally {
setLoading(false);
}
};

return (
<div className="modalBackdrop" onClick={(e)=>{ if(e.target.className==='modalBackdrop') onClose?.(); }}>
<div className="modalCard">
<div className="modalHeader">
<h3>Ajouter un repas</h3>
<button className="btnClose" onClick={onClose}>✖</button>
</div>

<div className="modalGrid">
<label>Jour
<select value={day} onChange={e=>setDay(e.target.value)}>
{DAYS.map(d => <option key={d} value={d}>{d}</option>)}
</select>
</label>
<label>Créneau
<select value={slot} onChange={e=>setSlot(e.target.value)}>
{SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
</select>
</label>
</div>

<label>Nom du repas (facultatif)
<input
placeholder="Ex : Salade de poulet"
value={name}
onChange={e=>setName(e.target.value)}
/>
</label>

<div className="fridgeBlock">
<p className="blockTitle">Produits du frigo</p>
{error && <p className="errorText">{error}</p>}
{fridgeItems.length === 0 && !error && (
<p className="muted">Aucun produit trouvé dans le frigo.</p>
)}
{fridgeItems.length > 0 && (
<ul className="fridgeList">
{fridgeItems.map(it => (
<li key={it.id}>
<label className="checkLine">
<input
type="checkbox"
checked={selectedIds.has(it.id)}
onChange={()=>toggleItem(it.id)}
/>
<span>{it.name ?? it.nom ?? 'Produit'}</span>
{it.expirationDate && <em> — {it.expirationDate}</em>}
</label>
</li>
))}
</ul>
)}
</div>

<div className="modalActions">
<button className="btnGhost" onClick={onClose} disabled={loading}>Annuler</button>
<button className="btnPrimary" onClick={saveMeal} disabled={loading}>
{loading ? 'Enregistrement…' : 'Sauvegarder'}
</button>
</div>
</div>
</div>
);
}
