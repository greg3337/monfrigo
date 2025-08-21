'use client';

import React, { useEffect, useRef, useState } from 'react';
import { getAuth } from 'firebase/auth';
import {
collection, query, where, orderBy, getDocs, addDoc, doc, deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase/firebase-config'; // <-- adapte si besoin

export default function CreateMealModal({ defaultDay, defaultSlot, closeModal }) {
const [day, setDay] = useState(defaultDay || 'Lundi');
const [slot, setSlot] = useState(defaultSlot || 'Déjeuner');
const [name, setName] = useState('');
const [loading, setLoading] = useState(true);
const [loadError, setLoadError] = useState('');
const [products, setProducts] = useState([]);
const [selectedIds, setSelectedIds] = useState([]);

const overlayRef = useRef(null);

// ======= Fermeture (overlay + ESC) =======
useEffect(() => {
function onKey(e) {
if (e.key === 'Escape') closeModal?.();
}
document.addEventListener('keydown', onKey);
return () => document.removeEventListener('keydown', onKey);
}, [closeModal]);

const onOverlayClick = (e) => {
if (e.target === overlayRef.current) closeModal?.();
};

// ======= Charger les produits du frigo =======
useEffect(() => {
(async () => {
setLoading(true);
setLoadError('');
try {
const auth = getAuth();
const user = auth.currentUser;
if (!user) {
setProducts([]);
setLoadError("Vous n'êtes pas connecté.");
setLoading(false);
return;
}

// Collection root "fridge" avec un champ userId
const q = query(
collection(db, 'fridge'),
where('userId', '==', user.uid),
orderBy('name', 'asc')
);
const snap = await getDocs(q);
const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));

setProducts(rows);
} catch (err) {
console.error('Fridge load error:', err);
setLoadError("Impossible de charger les produits du frigo.");
} finally {
setLoading(false);
}
})();
}, []);

// ======= Sauvegarder le repas =======
const saveMeal = async () => {
try {
const auth = getAuth();
const user = auth.currentUser;
if (!user) return;

// 1) créer le repas (collection "meals")
const mealRef = await addDoc(collection(db, 'meals'), {
userId: user.uid,
day,
slot,
name: name?.trim() || null,
productIds: selectedIds,
createdAt: Date.now()
});

// 2) supprimer du frigo les produits sélectionnés
await Promise.all(
selectedIds.map(id => deleteDoc(doc(db, 'fridge', id)))
);

// 3) fermer
closeModal?.();
} catch (err) {
console.error('Save meal error:', err);
alert("Une erreur est survenue lors de l'enregistrement.");
}
};

const toggleSelect = (id) => {
setSelectedIds(prev =>
prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
);
};

return (
<div
className="modalOverlay"
ref={overlayRef}
onClick={onOverlayClick}
role="dialog"
aria-modal="true"
>
<div className="modalCard" onClick={e => e.stopPropagation()}>
<div className="modalHeader">
<h3>Ajouter un repas</h3>
<button
type="button"
className="modalClose"
aria-label="Fermer"
onClick={() => closeModal?.()}
>×</button>
</div>

<div className="modalBody">
{/* Jour + créneau */}
<div className="row">
<label>
Jour
<select value={day} onChange={e => setDay(e.target.value)}>
{['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'].map(d =>
<option key={d} value={d}>{d}</option>
)}
</select>
</label>

<label>
Créneau
<select value={slot} onChange={e => setSlot(e.target.value)}>
{['Déjeuner','Dîner'].map(s =>
<option key={s} value={s}>{s}</option>
)}
</select>
</label>
</div>

{/* Nom */}
<label className="full">
Nom du repas (facultatif)
<input
placeholder="Ex : Salade de poulet"
value={name}
onChange={e => setName(e.target.value)}
/>
</label>

{/* Produits du frigo */}
<div className="full">
<h4>Produits du frigo</h4>

{loading && <p>Chargement…</p>}
{!loading && loadError && (
<p className="error">{loadError}</p>
)}

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
onChange={() => toggleSelect(p.id)}
/>
<span className="name">{p.name}</span>
{p.expirationDate && (
<span className="meta">{p.expirationDate}</span>
)}
</label>
</li>
))}
</ul>
)}
</div>
</div>

<div className="modalActions">
<button type="button" className="btnGhost" onClick={() => closeModal?.()}>
Annuler
</button>
<button
type="button"
className="btnPrimary"
onClick={saveMeal}
disabled={loading}
>
Sauvegarder
</button>
</div>
</div>
</div>
);
}
