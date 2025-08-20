'use client';

import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase/firebase-config';
import {
collection,
query,
where,
getDocs,
addDoc,
writeBatch,
doc,
Timestamp,
} from 'firebase/firestore';

const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const SLOTS = ['Déjeuner','Dîner'];

// ⚠️ Si ta collection s’appelle "frigo", remplace 'fridge' par 'frigo'
const FRIDGE_COLLECTION = 'fridge';
const MEALS_COLLECTION = 'meals';

export default function CreateMealModal({ defaultDay = 'Lundi', defaultSlot = 'Déjeuner', onClose }) {
const [userId, setUserId] = useState(null);
const [day, setDay] = useState(defaultDay);
const [slot, setSlot] = useState(defaultSlot);
const [name, setName] = useState('');

const [loading, setLoading] = useState(true);
const [fridgeProducts, setFridgeProducts] = useState([]); // [{id, name, expirationDate}]
const [selectedIds, setSelectedIds] = useState([]); // ids cochés
const [saving, setSaving] = useState(false);
const [err, setErr] = useState('');

// Auth
useEffect(() => {
const unsub = auth.onAuthStateChanged(u => setUserId(u?.uid || null));
return () => unsub();
}, []);

// Charger les produits du frigo (pour cet utilisateur)
useEffect(() => {
if (!userId) return;
setLoading(true);
setErr('');
(async () => {
try {
const qRef = query(collection(db, FRIDGE_COLLECTION), where('userId', '==', userId));
const snap = await getDocs(qRef);
const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
setFridgeProducts(rows);
} catch (e) {
console.error('Load fridge error', e);
setErr("Impossible de charger les produits du frigo.");
} finally {
setLoading(false);
}
})();
}, [userId]);

const toggle = (id) => {
setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
};

const onSave = async () => {
if (!userId) return;
if (selectedIds.length === 0 && !name.trim()) {
setErr('Ajoute un nom ou sélectionne au moins un produit.');
return;
}
setSaving(true); setErr('');
try {
const picked = fridgeProducts
.filter(p => selectedIds.includes(p.id))
.map(p => ({ id: p.id, name: p.name || 'Produit', expirationDate: p.expirationDate || null }));

// 1) Créer le repas
await addDoc(collection(db, MEALS_COLLECTION), {
userId,
day,
slot,
name: name.trim() || (picked.length ? picked.map(p=>p.name).join(' + ') : null),
products: picked,
createdAt: Timestamp.now(),
});

// 2) Supprimer du frigo les produits utilisés (batch)
if (selectedIds.length) {
const batch = writeBatch(db);
selectedIds.forEach(pid => batch.delete(doc(db, FRIDGE_COLLECTION, pid)));
await batch.commit();
}

onClose?.();
} catch (e) {
console.error('Save meal error', e);
setErr("Échec de l'enregistrement du repas.");
} finally {
setSaving(false);
}
};

return (
<div className="modalContent">
<h3>Ajouter un repas</h3>
<p className="muted" style={{margin:'6px 0 12px'}}>
{day} — {slot}
</p>

<div className="row">
<label>
Jour
<select value={day} onChange={e=>setDay(e.target.value)}>
{DAYS.map(d => <option key={d} value={d}>{d}</option>)}
</select>
</label>

<label>
Créneau
<select value={slot} onChange={e=>setSlot(e.target.value)}>
{SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
</select>
</label>
</div>

<label className="row full">
Nom du repas (facultatif)
<input
type="text"
placeholder="Ex : Salade de poulet"
value={name}
onChange={e=>setName(e.target.value)}
/>
</label>

<div className="pickerBlock">
<div className="pickerHead">Produits du frigo</div>
{loading ? (
<p className="muted">Chargement…</p>
) : fridgeProducts.length === 0 ? (
<p className="muted">Aucun produit trouvé. Ajoute d’abord des produits dans l’onglet Frigo.</p>
) : (
<ul className="productPickList">
{fridgeProducts.map(p => (
<li key={p.id}>
<label className="pick">
<input
type="checkbox"
checked={selectedIds.includes(p.id)}
onChange={() => toggle(p.id)}
/>
<span className="pickName">{p.name || 'Produit'}</span>
{p.expirationDate && <span className="pickMeta">{p.expirationDate}</span>}
</label>
</li>
))}
</ul>
)}
</div>

{err && <p className="error">{err}</p>}

<div className="modalActions">
<button className="btnPrimary" onClick={onSave} disabled={saving}>
{saving ? 'Enregistrement…' : 'Sauvegarder'}
</button>
<button className="btnGhost" onClick={onClose}>Annuler</button>
</div>
</div>
);
}
