'use client';

import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase/firebase-config';
import { collection, onSnapshot } from 'firebase/firestore';

const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const SLOTS = ['Petit-déjeuner','Déjeuner','Dîner','Goûter'];

export default function CreateMealModal({ defaultDay, defaultSlot, onCancel, onCreate }) {
const [user, setUser] = useState(null);
const [name, setName] = useState('');
const [day, setDay] = useState(defaultDay || 'Lundi');
const [slot, setSlot] = useState(defaultSlot || 'Déjeuner');
const [products, setProducts] = useState([]);
const [selectedProductId, setSelectedProductId] = useState('');

useEffect(() => {
const unsubAuth = onAuthStateChanged(auth, (u) => setUser(u || null));
return () => unsubAuth();
}, []);

// Charger la liste des produits du frigo
useEffect(() => {
if (!user) return;
const col = collection(db, 'users', user.uid, 'products');
const unsub = onSnapshot(col, (snap) => {
const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
// tri par date d’expiration (si dispo)
rows.sort((a, b) => {
const da = a.expirationDate || '';
const dbb = b.expirationDate || '';
return String(da).localeCompare(String(dbb));
});
setProducts(rows);
});
return () => unsub();
}, [user]);

const selectedProduct = selectedProductId
? products.find(p => p.id === selectedProductId)
: null;

const handleSave = async () => {
if (!onCreate) return;
await onCreate({
name: name.trim() || (selectedProduct?.name ?? 'Repas'),
day,
slot,
product: selectedProduct
? { id: selectedProduct.id, name: selectedProduct.name }
: null,
});
};

return (
<div className="modalOverlay" role="dialog" aria-modal="true">
<div className="modal">
<h3>Ajouter un repas</h3>

<div className="modalRow">
<label>Nom du repas
<input
value={name}
onChange={(e) => setName(e.target.value)}
placeholder="ex : Pâtes bolo"
/>
</label>
</div>

<div className="modalGrid">
<label>Jour
<select value={day} onChange={(e) => setDay(e.target.value)}>
{DAYS.map(d => <option key={d} value={d}>{d}</option>)}
</select>
</label>

<label>Créneau
<select value={slot} onChange={(e) => setSlot(e.target.value)}>
{SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
</select>
</label>
</div>

<div className="modalRow">
<label>Produit du frigo
<select
value={selectedProductId}
onChange={(e) => setSelectedProductId(e.target.value)}
>
<option value="">— Aucun produit sélectionné —</option>
{products.map(p => (
<option key={p.id} value={p.id}>
{p.name}{p.expirationDate ? ` — ${p.expirationDate}` : ''}
</option>
))}
</select>
</label>
</div>

<div className="modalActions">
<button className="btnGhost" onClick={onCancel}>Annuler</button>
<button className="btnPrimary" onClick={handleSave}>Enregistrer</button>
</div>
</div>
</div>
);
}
