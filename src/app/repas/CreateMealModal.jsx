'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
collection, getDocs, addDoc, serverTimestamp,
writeBatch, doc
} from 'firebase/firestore';
import { db } from '../firebase/firebase-config'; // <- chemin depuis /repas/

const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const SLOTS = ['Déjeuner','Dîner'];

// Essais de chemins de frigo
const ROOT_CANDIDATES = ['frigo', 'fridge', 'products'];
const SUB_COLL_NAMES = ['frigo', 'fridge', 'products'];

export default function CreateMealModal({
onClose,
defaultDay = DAYS[0],
defaultSlot = SLOTS[0],
userId = null,
}) {
const [day, setDay] = useState(defaultDay);
const [slot, setSlot] = useState(defaultSlot);
const [mealName, setMealName] = useState('');

const [loading, setLoading] = useState(true);
const [err, setErr] = useState('');
const [fridgeProducts, setFridgeProducts] = useState([]);
const [selectedIds, setSelectedIds] = useState(new Set()); // ids cochés

const hasSelection = selectedIds.size > 0;

const toggleId = (id) => {
setSelectedIds(prev => {
const n = new Set(prev);
if (n.has(id)) n.delete(id); else n.add(id);
return n;
});
};

// Charger les produits (robuste)
useEffect(() => {
let cancelled = false;

const load = async () => {
setLoading(true);
setErr('');

try {
let rows = [];

// a) Racine
for (const name of ROOT_CANDIDATES) {
try {
const snap = await getDocs(collection(db, name));
const arr = snap.docs.map(d => ({
id: d.id,
_path: `/${name}/${d.id}`,
...d.data()
}));
if (arr.length) { rows = arr; break; }
} catch {}
}

// b) Sous-collection users/{uid}/xxx
if (!rows.length && userId) {
for (const sub of SUB_COLL_NAMES) {
try {
const snap = await getDocs(collection(db, 'users', userId, sub));
const arr = snap.docs.map(d => ({
id: d.id,
_path: `/users/${userId}/${sub}/${d.id}`,
...d.data()
}));
if (arr.length) { rows = arr; break; }
} catch {}
}
}

// c) Rien trouvé
if (!rows.length) {
if (!cancelled) {
setFridgeProducts([]);
setErr("Aucun produit trouvé. Ajoute d’abord des produits dans l’onglet Frigo.");
}
return;
}

// d) Normalisation pour affichage
rows = rows.map(r => ({
...r,
name: r.name || r.productName || 'Produit',
expirationDate: r.expirationDate || r.expiry || null,
}));

if (!cancelled) setFridgeProducts(rows);
} catch (e) {
if (!cancelled) setErr("Impossible de charger les produits du frigo.");
console.error('load fridge error', e);
} finally {
if (!cancelled) setLoading(false);
}
};

load();
return () => { cancelled = true; };
}, [userId]);

// Liste finale des produits cochés
const selectedProducts = useMemo(
() => fridgeProducts.filter(p => selectedIds.has(p.id)),
[fridgeProducts, selectedIds]
);

// Enregistrer le repas + supprimer produits sélectionnés
const onSave = async () => {
try {
// 1) Création repas (on préfère sous users/{uid}/meals si possible)
const mealColl = userId
? collection(db, 'users', userId, 'meals')
: collection(db, 'meals');

const payload = {
userId: userId || null,
day,
slot,
name: mealName?.trim() || null,
products: selectedProducts.map(p => ({
id: p.id,
name: p.name || 'Produit',
path: p._path || null,
})),
createdAt: serverTimestamp(),
};

await addDoc(mealColl, payload);

// 2) Suppression des produits du frigo (exact path)
if (selectedProducts.length) {
const batch = writeBatch(db);
selectedProducts.forEach(p => {
if (p._path) {
// _path est de la forme "/users/uid/frigo/docId" ou "/frigo/docId"
const clean = p._path.replace(/^\//,''); // retire le premier "/"
batch.delete(doc(db, clean));
}
});
await batch.commit();
}

onClose?.();
} catch (e) {
console.error('save meal error', e);
alert("Erreur lors de l’enregistrement du repas.");
}
};

return (
<div className="modalOverlay">
<div className="modal">
<div className="modalHeader">
<h3>Ajouter un repas</h3>
<button className="btnGhost" onClick={onClose}>✕</button>
</div>

<div className="modalBody">
<div className="row">
<div className="field">
<label>Jour</label>
<select value={day} onChange={e => setDay(e.target.value)}>
{DAYS.map(d => <option key={d} value={d}>{d}</option>)}
</select>
</div>
<div className="field">
<label>Créneau</label>
<select value={slot} onChange={e => setSlot(e.target.value)}>
{SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
</select>
</div>
</div>

<div className="field">
<label>Nom du repas (facultatif)</label>
<input
type="text"
placeholder="Ex : Salade de poulet"
value={mealName}
onChange={e => setMealName(e.target.value)}
/>
</div>

<div className="field">
<label>Produits du frigo</label>

{loading && <div>Chargement…</div>}

{!loading && err && (
<p style={{color:'#c0392b', marginTop:6}}>{err}</p>
)}

{!loading && !err && !fridgeProducts.length && (
<p>Aucun produit trouvé dans le frigo.</p>
)}

{!loading && !err && fridgeProducts.length > 0 && (
<ul className="productList">
{fridgeProducts.map(p => (
<li key={p.id} className="productItem">
<label>
<input
type="checkbox"
checked={selectedIds.has(p.id)}
onChange={() => toggleId(p.id)}
/>
<span className="productName">{p.name}</span>
{p.expirationDate && (
<span className="pill">{String(p.expirationDate)}</span>
)}
</label>
</li>
))}
</ul>
)}
</div>
</div>

<div className="modalActions">
<button className="btnGhost" onClick={onClose}>Annuler</button>
<button className="primary" disabled={!hasSelection} onClick={onSave}>
Sauvegarder
</button>
</div>
</div>

<style jsx>{`
.modalOverlay{position:fixed;inset:0;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;z-index:999}
.modal{width:min(720px,92vw);background:#fff;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,.18);padding:16px}
.modalHeader{display:flex;align-items:center;justify-content:space-between}
.row{display:flex;gap:12px}
.field{display:flex;flex-direction:column;gap:6px;flex:1;margin-top:10px}
.productList{list-style:none;padding:0;margin:8px 0;display:flex;flex-direction:column;gap:8px;max-height:260px;overflow:auto}
.productItem{background:#fafafa;border:1px solid #eee;padding:8px;border-radius:8px}
.pill{margin-left:8px;font-size:.8rem;opacity:.7}
.btnGhost{background:#f4f4f4;border:1px solid #e0e0e0;border-radius:8px;padding:8px 12px}
.primary{background:#1976d2;color:#fff;border:none;border-radius:8px;padding:8px 12px}
.modalActions{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}
@media (max-width:520px){ .row{flex-direction:column} }
`}</style>
</div>
);
}
