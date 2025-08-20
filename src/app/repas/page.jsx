'use client';

import React, { useEffect, useState } from 'react';
import {
collection,
query,
where,
getDocs,
addDoc,
serverTimestamp,
writeBatch,
doc
} from 'firebase/firestore';
import { db } from '../firebase/firebase-config'; // ← chemin depuis /repas : ../firebase/...
import useAuth from '../hooks/useAuth'; // même hook que sur les autres pages

/**
* Modale d’ajout de repas :
* - liste les produits du frigo (collection "fridge")
* - permet de sélectionner 1..n produits
* - crée un doc dans "meals"
* - supprime du frigo les produits utilisés (batch)
*/
export default function CreateMealModal({ dayLabel, slotLabel, onClose, onSaved }) {
const { user } = useAuth();
const [loading, setLoading] = useState(true);
const [fridgeProducts, setFridgeProducts] = useState([]);
const [checked, setChecked] = useState({}); // { productId: true/false }
const [saving, setSaving] = useState(false);

useEffect(() => {
const loadFridge = async () => {
try {
if (!user) return;
const qFridge = query(
collection(db, 'fridge'),
where('userId', '==', user.uid)
);
const snap = await getDocs(qFridge);
const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
setFridgeProducts(items);
} finally {
setLoading(false);
}
};
loadFridge();
}, [user]);

const toggle = (id) => {
setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
};

const handleSave = async () => {
if (!user || saving) return;
const selected = fridgeProducts.filter(p => checked[p.id]);
if (selected.length === 0) {
// rien sélectionné -> on ne fait rien
onClose?.();
return;
}

setSaving(true);
try {
// 1) crée le repas
await addDoc(collection(db, 'meals'), {
userId: user.uid,
day: dayLabel,
slot: slotLabel,
// nom = concat simple des produits sélectionnés
name: selected.map(s => s.name || s.p_name || 'Produit').join(' + '),
items: selected.map(s => ({
productId: s.id,
name: s.name || s.p_name || '',
expirationDate: s.expirationDate || s.p_expirationDate || null,
category: s.category || s.p_category || null,
})),
createdAt: serverTimestamp()
});

// 2) supprime du frigo les produits utilisés
const batch = writeBatch(db);
selected.forEach((s) => {
batch.delete(doc(db, 'fridge', s.id));
});
await batch.commit();

onSaved?.();
} catch (e) {
console.error('Erreur enregistrement repas:', e);
onClose?.();
} finally {
setSaving(false);
}
};

return (
<div className="modalContent">
<h3>Ajouter un repas</h3>
<p style={{ margin: '6px 0 12px' }}>
<strong>{dayLabel} - {slotLabel}</strong>
</p>

{loading ? (
<p>Chargement des produits…</p>
) : fridgeProducts.length === 0 ? (
<div className="empty">
<p>Aucun produit dans le frigo</p>
</div>
) : (
<div className="productList">
{fridgeProducts.map(p => {
const label = p.name || p.p_name || 'Produit';
const date = p.expirationDate || p.p_expirationDate || null;
return (
<label key={p.id} className="productRow">
<input
type="checkbox"
checked={!!checked[p.id]}
onChange={() => toggle(p.id)}
/>
<span className="productName">{label}</span>
{date ? <span className="productDate">{date}</span> : null}
</label>
);
})}
</div>
)}

<div className="modalActions">
<button
type="button"
className="btnPrimary"
onClick={handleSave}
disabled={saving}
>
{saving ? 'Enregistrement…' : 'Sauvegarder'}
</button>
<button type="button" className="btnGhost" onClick={onClose}>
Annuler
</button>
</div>
</div>
);
}
