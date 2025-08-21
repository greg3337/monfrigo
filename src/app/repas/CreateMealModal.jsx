'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
collection, getDocs, addDoc, serverTimestamp,
writeBatch, doc
} from 'firebase/firestore';
import { db } from '../firebase/firebase-config'; // chemin: src/app/firebase/firebase-config.ts

const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const SLOTS = ['Déjeuner','Dîner'];

export default function CreateMealModal({
open,
onClose,
defaultDay = 'Lundi',
defaultSlot = 'Déjeuner',
onSaved,
user
}) {
const [day, setDay] = useState(defaultDay);
const [slot, setSlot] = useState(defaultSlot);
const [name, setName] = useState('');
const [loading, setLoading] = useState(false);
const [loadingFridge, setLoadingFridge] = useState(false);
const [errorFridge, setErrorFridge] = useState('');
const [fridgeItems, setFridgeItems] = useState([]); // [{id, name, expirationDate?...}]
const [selectedIds, setSelectedIds] = useState([]);

useEffect(() => {
setDay(defaultDay);
setSlot(defaultSlot);
}, [defaultDay, defaultSlot]);

useEffect(() => {
if (!open) return;
if (!user?.uid) { setFridgeItems([]); return; }

// Charge les produits du frigo de l'utilisateur
(async () => {
setLoadingFridge(true);
setErrorFridge('');
try {
// Ton app stocke généralement ici : users/{uid}/fridge
const cands = ['fridge', 'products', 'items', 'fridgeItems'];
let found = [];
for (const cName of cands) {
try {
const snap = await getDocs(collection(db, 'users', user.uid, cName));
if (!snap.empty) {
found = snap.docs.map(d => ({ id: d.id, ...d.data() }));
break;
}
} catch (err) {
// ignore et essaie la suivante
}
}
setFridgeItems(found);
} catch (err) {
setErrorFridge("Impossible de charger les produits du frigo.");
setFridgeItems([]);
} finally {
setLoadingFridge(false);
}
})();
}, [open, user?.uid]);

const canSave = useMemo(() => !loading && !!day && !!slot, [loading, day, slot]);

const toggleSelect = (id) => {
setSelectedIds((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
};

const handleSave = async () => {
if (!user?.uid) { onClose?.(); return; }
setLoading(true);
try {
// 1) crée le repas
const payload = {
day, slot,
name: name.trim(),
products: fridgeItems.filter(p => selectedIds.includes(p.id)).map(p => ({ id: p.id, name: p.name || p.nom || 'Produit' })),
createdAt: serverTimestamp(),
};
const ref = await addDoc(collection(db, 'users', user.uid, 'meals'), payload);

// 2) supprime du frigo les produits sélectionnés
if (selectedIds.length > 0) {
const batch = writeBatch(db);
selectedIds.forEach(id => {
batch.delete(doc(db, 'users', user.uid, 'fridge', id));
});
await batch.commit();
}

onSaved?.({ id: ref.id, ...payload, products: payload.products });
} catch (err) {
// on n’échoue pas brutalement l’UI : on ferme simplement
console.error(err);
onClose?.();
} finally {
setLoading(false);
}
};

if (!open) return null;

return (
<div className="modal_backdrop" role="dialog" aria-modal="true">
<div className="modal_card">
<div className="modal_head">
<h3>Ajouter un repas</h3>
<button className="btn_close" onClick={onClose} aria-label="Fermer">×</button>
</div>

<div className="gridTwo">
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

<label className="mt8">
Nom du repas (facultatif)
<input
placeholder="Ex : Salade de poulet"
value={name}
onChange={e => setName(e.target.value)}
/>
</label>

<h4 className="mt16">Produits du frigo</h4>
{loadingFridge && <p className="muted">Chargement…</p>}
{!loadingFridge && errorFridge && <p className="error">{errorFridge}</p>}
{!loadingFridge && !errorFridge && fridgeItems.length === 0 && (
<p className="muted">Aucun produit trouvé dans le frigo.</p>
)}
{!loadingFridge && fridgeItems.length > 0 && (
<ul className="fridgeList">
{fridgeItems.map(p => (
<li key={p.id} className="checkLine">
<label>
<input
type="checkbox"
checked={selectedIds.includes(p.id)}
onChange={() => toggleSelect(p.id)}
/>
<span>{p.name || p.nom || 'Produit'}</span>
{p.expirationDate && (
<small className="muted"> — {String(p.expirationDate)}</small>
)}
</label>
</li>
))}
</ul>
)}

<div className="modalActions">
<button className="btnGhost" onClick={onClose} disabled={loading}>Annuler</button>
<button className="btnPrimary" onClick={handleSave} disabled={!canSave}>
{loading ? '…' : 'Sauvegarder'}
</button>
</div>
</div>
</div>
);
}
