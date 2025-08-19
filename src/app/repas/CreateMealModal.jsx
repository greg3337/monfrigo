'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { db } from '../firebase/firebase-config';
import {
addDoc,
collection,
deleteDoc,
doc,
onSnapshot,
query,
orderBy,
} from 'firebase/firestore';

const SLOTS = ['Petit-déjeuner', 'Déjeuner', 'Dîner', 'Goûter'];
const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];

export default function CreateMealModal({ uid, defaultDay, defaultSlot, closeModal }) {
const [name, setName] = useState('');
const [day, setDay] = useState(defaultDay || 'Lundi');
const [slot, setSlot] = useState(defaultSlot || 'Déjeuner');

const [products, setProducts] = useState([]); // Produits du frigo
const [selectedProductId, setSelectedProductId] = useState('');

// Charger les produits du frigo (tri par date d’expiration si dispo)
useEffect(() => {
if (!uid) return;
const q = query(collection(db, 'users', uid, 'products'), orderBy('expirationDate', 'asc'));
const unsub = onSnapshot(q, (snap) => {
const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
setProducts(list);
});
return () => unsub();
}, [uid]);

const selectedProduct = useMemo(
() => products.find((p) => p.id === selectedProductId),
[products, selectedProductId]
);

// Sauvegarde : crée le repas + supprime le produit choisi (si choisi)
const handleSave = async () => {
const trimmed = name.trim() || selectedProduct?.name || '';
if (!trimmed) return;

try {
// 1) crée le repas
await addDoc(collection(db, 'users', uid, 'meals'), {
name: trimmed,
day,
slot,
createdAt: new Date(),
productId: selectedProduct?.id || null,
productName: selectedProduct?.name || null,
});

// 2) supprime le produit du frigo si un produit a été sélectionné
if (selectedProduct?.id) {
await deleteDoc(doc(db, 'users', uid, 'products', selectedProduct.id));
}

closeModal();
} catch (e) {
console.error('Save meal error', e);
// tu peux afficher un toast si tu veux
}
};

return (
<div className="modalOverlay" onClick={closeModal}>
<div className="modalWindow" onClick={(e) => e.stopPropagation()}>
<h3 style={{ marginTop: 0 }}>Ajouter un repas</h3>

<div style={{ display: 'grid', gap: 10 }}>
{/* Nom libre (optionnel si tu sélectionnes un produit) */}
<label>
Nom du repas
<input
type="text"
placeholder="ex : Salade poulet-avocat"
value={name}
onChange={(e) => setName(e.target.value)}
style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: 8 }}
/>
</label>

{/* Jour */}
<label>
Jour
<select value={day} onChange={(e) => setDay(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8 }}>
{DAYS.map((d) => (
<option key={d} value={d}>{d}</option>
))}
</select>
</label>

{/* Créneau */}
<label>
Créneau
<select value={slot} onChange={(e) => setSlot(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8 }}>
{SLOTS.map((s) => (
<option key={s} value={s}>{s}</option>
))}
</select>
</label>

{/* Produit du frigo (optionnel) */}
<label>
Choisir un produit du frigo (optionnel)
<select
value={selectedProductId}
onChange={(e) => setSelectedProductId(e.target.value)}
style={{ width: '100%', padding: 8, borderRadius: 8 }}
>
<option value="">— Aucun produit sélectionné —</option>
{products.map((p) => (
<option key={p.id} value={p.id}>
{p.name}{p.expirationDate ? ` — ${p.expirationDate}` : ''}
</option>
))}
</select>
</label>
</div>

<div className="modalActions">
<button className="btnPrimary" onClick={handleSave}>Enregistrer</button>
<button className="btnGhost" onClick={closeModal}>Annuler</button>
</div>
</div>
</div>
);
}
