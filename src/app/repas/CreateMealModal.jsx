'use client';

import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase/firebase-config';
import {
addDoc,
collection,
Timestamp,
query,
where,
getDocs,
doc,
deleteDoc,
} from 'firebase/firestore';

const SLOTS = ['Déjeuner', 'Dîner'];
const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];

// On essaie plusieurs collections / champs possibles
const FRIDGE_COLLECTIONS = ['fridge', 'frigo', 'products'];
const USER_FIELDS = ['userId', 'uid', 'ownerId'];

export default function CreateMealModal({ defaultDay, defaultSlot, onClose }) {
const [userId, setUserId] = useState(null);

const [day, setDay] = useState(defaultDay || 'Lundi');
const [slot, setSlot] = useState(defaultSlot || 'Déjeuner');
const [name, setName] = useState('');
const [products, setProducts] = useState([]); // {id, name, expirationDate?, __col}
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);

// Auth
useEffect(() => {
const unsub = auth.onAuthStateChanged((u) => setUserId(u ? u.uid : null));
return () => unsub();
}, []);

// Charger les produits du frigo (autodétection)
useEffect(() => {
if (!userId) return;
let cancelled = false;

(async () => {
setLoading(true);
try {
// 1) On tente coll x champ (filtré par user)
for (const collName of FRIDGE_COLLECTIONS) {
for (const f of USER_FIELDS) {
try {
const qy = query(collection(db, collName), where(f, '==', userId));
const snap = await getDocs(qy);
const rows = snap.docs.map((d) => ({ id: d.id, __col: collName, ...d.data() }));
if (!cancelled && rows.length) {
setProducts(rows);
setLoading(false);
return;
}
} catch (_) {
/* ignore et continue */
}
}
}
// 2) Dernier recours : sans filtre (utile si les docs n'ont pas de userId)
for (const collName of FRIDGE_COLLECTIONS) {
try {
const snap = await getDocs(collection(db, collName));
const rows = snap.docs.map((d) => ({ id: d.id, __col: collName, ...d.data() }));
if (!cancelled && rows.length) {
setProducts(rows);
setLoading(false);
return;
}
} catch (_) {/* ignore */}
}

if (!cancelled) {
setProducts([]);
setLoading(false);
}
} catch (e) {
console.error('Load fridge products error:', e);
if (!cancelled) {
setProducts([]);
setLoading(false);
}
}
})();

return () => { cancelled = true; };
}, [userId]);

const [selectedIds, setSelectedIds] = useState([]);
const togglePick = (id) => {
setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
};

const handleSave = async () => {
if (!userId) return;
if (selectedIds.length === 0 && !name.trim()) {
alert('Ajoute un nom ou sélectionne au moins un produit.');
return;
}
setSaving(true);
try {
const picked = products
.filter((p) => selectedIds.includes(p.id))
.map((p) => ({ id: p.id, name: p.name || p.label || 'Produit' }));

await addDoc(collection(db, 'meals'), {
userId,
day,
slot,
name: name.trim(),
products: picked,
createdAt: Timestamp.now(),
});

// Supprimer les produits utilisés dans leur collection d'origine
for (const p of products.filter((x) => selectedIds.includes(x.id))) {
try {
await deleteDoc(doc(db, p.__col || 'fridge', p.id));
} catch (e) {
console.warn('Delete from fridge failed for', p.__col, p.id, e);
}
}

onClose?.();
} catch (e) {
console.error('save meal error', e);
alert("Impossible d'enregistrer le repas.");
} finally {
setSaving(false);
}
};

return (
<div className="modalBack" role="dialog" aria-modal="true" aria-label="Ajouter un repas">
<div className="modalCard">
<header className="modalHead">
<h4>Ajouter un repas</h4>
<button className="btnGhost" onClick={onClose}>×</button>
</header>

<div className="modalBody">
<div className="row">
<label>
Jour
<select value={day} onChange={(e) => setDay(e.target.value)}>
{DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
</select>
</label>

<label>
Créneau
<select value={slot} onChange={(e) => setSlot(e.target.value)}>
{SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
</select>
</label>
</div>

<label className="row full">
Nom du repas (facultatif)
<input
type="text"
placeholder="Ex : Salade de poulet"
value={name}
onChange={(e) => setName(e.target.value)}
/>
</label>

<div className="pickerBlock">
<div className="pickerHead">Produits du frigo</div>
{loading ? (
<p className="muted">Chargement…</p>
) : products.length === 0 ? (
<p className="muted">Aucun produit trouvé dans le frigo.</p>
) : (
<ul className="productPickList">
{products.map((p) => {
const checked = selectedIds.includes(p.id);
return (
<li key={`${p.__col}:${p.id}`}>
<label className="pick">
<input
type="checkbox"
checked={checked}
onChange={() => togglePick(p.id)}
/>
<span className="pickName">{p.name || p.label || 'Produit'}</span>
{p.expirationDate && (
<span className="pickMeta">{p.expirationDate}</span>
)}
</label>
</li>
);
})}
</ul>
)}
</div>
</div>

<footer className="modalFoot">
<button className="btnPrimary" onClick={handleSave} disabled={saving}>
{saving ? 'Sauvegarde…' : 'Sauvegarder'}
</button>
<button className="btnGhost" onClick={onClose}>Annuler</button>
</footer>
</div>
</div>
);
}
