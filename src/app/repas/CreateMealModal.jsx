'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { db, auth } from '../../firebase/firebase-config';
import {
collection,
query,
where,
getDocs,
addDoc,
serverTimestamp,
writeBatch,
doc,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const SLOTS = ['Déjeuner', 'Dîner'];

export default function CreateMealModal({ defaultDay, defaultSlot, onClose, onSaved }) {
const [uid, setUid] = useState(null);

const [day, setDay] = useState(defaultDay || 'Lundi');
const [slot, setSlot] = useState(defaultSlot || 'Déjeuner');
const [name, setName] = useState('');
const [loading, setLoading] = useState(true);
const [products, setProducts] = useState([]); // [{id,name,expirationDate}]
const [selected, setSelected] = useState(new Set()); // ids
const [error, setError] = useState('');

useEffect(() => {
const unsub = onAuthStateChanged(auth, (u) => setUid(u ? u.uid : null));
return () => unsub();
}, []);

const loadFridge = async () => {
if (!uid) return;
setLoading(true);
setError('');
try {
// On lit dans users/{uid}/fridge
const q = query(
collection(db, 'users', uid, 'fridge'),
where('userId', '==', uid)
);
const snap = await getDocs(q);
const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
setProducts(rows);
} catch (e) {
console.error('loadFridge error', e);
setError("Impossible de charger les produits du frigo.");
} finally {
setLoading(false);
}
};

useEffect(() => { loadFridge(); /* eslint-disable-next-line */ }, [uid]);

const itemsForSave = useMemo(() => {
return products
.filter(p => selected.has(p.id))
.map(p => ({ id: p.id, name: p.name || p.title || 'Produit' }));
}, [products, selected]);

const toggle = (id) => {
setSelected((prev) => {
const copy = new Set(prev);
copy.has(id) ? copy.delete(id) : copy.add(id);
return copy;
});
};

const onSubmit = async (e) => {
e.preventDefault();
if (!uid) return;

try {
// 1) créer le repas
const mealRef = await addDoc(collection(db, 'users', uid, 'meals'), {
userId: uid,
day,
slot,
name: name.trim(),
items: itemsForSave,
createdAt: serverTimestamp(),
});

// 2) supprimer du frigo les items choisis
if (itemsForSave.length > 0) {
const batch = writeBatch(db);
itemsForSave.forEach((it) => {
batch.delete(doc(db, 'users', uid, 'fridge', it.id));
});
await batch.commit();
}

onSaved?.(mealRef.id);
} catch (e) {
console.error('save meal failed', e);
alert("Enregistrement impossible.");
}
};

return (
<div className="modalBackdrop" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
<div className="modal">
<div className="modalHeader">
<h3>Ajouter un repas</h3>
<button className="iconBtn" onClick={onClose} aria-label="Fermer">✕</button>
</div>

<form onSubmit={onSubmit} className="modalBody">
<div className="row">
<label>
<span>Jour</span>
<select value={day} onChange={(e) => setDay(e.target.value)}>
{DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
</select>
</label>

<label>
<span>Créneau</span>
<select value={slot} onChange={(e) => setSlot(e.target.value)}>
{SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
</select>
</label>
</div>

<label>
<span>Nom du repas (facultatif)</span>
<input
type="text"
placeholder="Ex : Salade de poulet"
value={name}
onChange={(e) => setName(e.target.value)}
/>
</label>

<div className="fridgeSection">
<div className="fridgeTitle">Produits du frigo</div>

{loading ? (
<p className="muted">Chargement…</p>
) : products.length === 0 ? (
<p className="muted">Aucun produit trouvé dans le frigo.</p>
) : (
<ul className="productList">
{products.map((p) => (
<li key={p.id}>
<label className="checkLine">
<input
type="checkbox"
checked={selected.has(p.id)}
onChange={() => toggle(p.id)}
/>
<span>{p.name || p.title}</span>
</label>
</li>
))}
</ul>
)}

{error && <p className="error">{error}</p>}
</div>

<div className="modalActions">
<button type="button" className="btnGhost" onClick={onClose}>Annuler</button>
<button type="submit" className="btnPrimary">Sauvegarder</button>
</div>
</form>
</div>
</div>
);
}
