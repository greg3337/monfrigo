'use client';

import React, { useEffect, useRef, useState } from 'react';
import { getAuth } from 'firebase/auth';
import {
addDoc, collection, deleteDoc, doc, getDocs, query, where
} from 'firebase/firestore';
import { db } from '../firebase/firebase-config';

const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const SLOTS = ['Déjeuner','Dîner'];

export default function CreateMealModal({ defaultDay, defaultSlot, closeModal }) {
const [day, setDay] = useState(defaultDay || 'Lundi');
const [slot, setSlot] = useState(defaultSlot || 'Déjeuner');
const [name, setName] = useState('');

const [loading, setLoading] = useState(true);
const [loadError, setLoadError] = useState('');
const [products, setProducts] = useState([]);
const [selectedIds, setSelectedIds] = useState([]);

const overlayRef = useRef(null);

// Fermer avec ESC et clic fond
useEffect(() => {
const onKey = (e) => e.key === 'Escape' && closeModal?.();
document.addEventListener('keydown', onKey);
return () => document.removeEventListener('keydown', onKey);
}, [closeModal]);

const onOverlayClick = (e) => {
if (e.target === overlayRef.current) closeModal?.();
};

// Charger frigo (fridge || products)
useEffect(() => {
(async () => {
setLoading(true);
setLoadError('');
try {
const auth = getAuth();
const user = auth.currentUser;
if (!user) throw new Error('Utilisateur non connecté');

async function loadFrom(colName) {
const q = query(collection(db, colName), where('userId', '==', user.uid));
const snap = await getDocs(q);
return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

let rows = await loadFrom('fridge');
if (rows.length === 0) {
// fallback selon certains projets
rows = await loadFrom('products');
}

setProducts(rows);
} catch (err) {
console.error('Load fridge error:', err);
setLoadError("Impossible de charger les produits du frigo.");
} finally {
setLoading(false);
}
})();
}, []);

const toggle = (id) => {
setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
};

const save = async () => {
try {
const auth = getAuth();
const user = auth.currentUser;
if (!user) return;

// Créer le repas
await addDoc(collection(db, 'meals'), {
userId: user.uid,
day,
slot,
name: name?.trim() || null,
productIds: selectedIds,
createdAt: Date.now()
});

// Supprimer les produits sélectionnés du frigo
await Promise.all(
selectedIds.map(id => deleteDoc(doc(db, 'fridge', id)).catch(() => null))
);
// (si ta collection est "products" sur ce projet)
await Promise.all(
selectedIds.map(id => deleteDoc(doc(db, 'products', id)).catch(() => null))
);

closeModal?.();
} catch (err) {
console.error('Save meal error:', err);
alert("Une erreur est survenue lors de l'enregistrement.");
}
};

return (
<div className="modalOverlay" ref={overlayRef} onClick={onOverlayClick}>
<div className="modalCard" onClick={(e) => e.stopPropagation()}>
<div className="modalHeader">
<h3>Ajouter un repas</h3>
<button className="modalClose" onClick={() => closeModal?.()}>×</button>
</div>

<div className="modalBody">
<div className="row">
<label>
Jour
<select value={day} onChange={e => setDay(e.target.value)}>
{DAYS.map(d => <option key={d} value={d}>{d}</option>)}
</select>
</label>
<label>
Créneau
<select value={slot} onChange={e => setSlot(e.target.value)}>
{SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
</select>
</label>
</div>

<label className="full">
Nom du repas (facultatif)
<input
placeholder="Ex : Salade de poulet"
value={name}
onChange={e => setName(e.target.value)}
/>
</label>

<div className="full">
<h4>Produits du frigo</h4>
{loading && <p>Chargement…</p>}
{!loading && loadError && <p className="error">{loadError}</p>}
{!loading && !loadError && products.length === 0 && (
<p>Aucun produit trouvé dans le frigo.</p>
)}
{!loading && !loadError && products.length > 0 && (
<ul className="productList">
{products.map(p => (
<li key={p.id}>
<label className="checkline">
<input
type="checkbox"
checked={selectedIds.includes(p.id)}
onChange={() => toggle(p.id)}
/>
<span className="name">{p.name}</span>
{p.expirationDate && <span className="meta">{p.expirationDate}</span>}
</label>
</li>
))}
</ul>
)}
</div>
</div>

<div className="modalActions">
<button className="btnGhost" onClick={() => closeModal?.()}>Annuler</button>
<button className="btnPrimary" onClick={save} disabled={loading}>Sauvegarder</button>
</div>
</div>
</div>
);
}
