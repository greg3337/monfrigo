'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { db, auth } from '../firebase/firebase-config';
import {
collection,
query,
where,
orderBy,
getDocs,
addDoc,
Timestamp,
doc,
deleteDoc,
} from 'firebase/firestore';

const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const SLOTS = ['Petit-déjeuner','Déjeuner','Dîner','Goûter'];

export default function CreateMealModal({
defaultDay = 'Lundi',
defaultSlot = 'Déjeuner',
onClose,
onSaved,
}) {
const user = auth.currentUser;

// UI state
const [day, setDay] = useState(defaultDay);
const [slot, setSlot] = useState(defaultSlot);
const [name, setName] = useState('');
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [error, setError] = useState('');

// Fridge products
const [fridgeProducts, setFridgeProducts] = useState([]); // [{id, name, ...}]
const [selectedIds, setSelectedIds] = useState([]); // ids choisis

const nothingInFridge = useMemo(() => !loading && fridgeProducts.length === 0, [loading, fridgeProducts]);

useEffect(() => {
let ignore = false;
async function loadFridge() {
if (!user) { setLoading(false); return; }
setLoading(true);
setError('');

// essaie successivement `fridge`, puis `frigo`, puis `products`
const tryCollections = ['fridge', 'frigo', 'products'];
let fetched = [];

try {
for (const colName of tryCollections) {
const colRef = collection(db, colName);
// on filtre par userId si présent
const q = query(
colRef,
where('userId', '==', user.uid)
);
const snap = await getDocs(q);
const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));

if (rows.length > 0) {
fetched = rows;
break; // trouvé
}
}
} catch (e) {
console.error('Erreur chargement frigo:', e);
setError("Impossible de charger les produits du frigo.");
}

if (!ignore) {
setFridgeProducts(fetched);
setLoading(false);
}
}

loadFridge();
return () => { ignore = true; };
}, [user]);

const togglePick = (id) => {
setSelectedIds(prev =>
prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
);
};

const handleSave = async () => {
if (!user) { setError("Vous n'êtes pas connecté."); return; }
if (selectedIds.length === 0) {
setError('Sélectionne au moins un produit du frigo.');
return;
}

setSaving(true);
setError('');

try {
// infos produits retenus
const picked = fridgeProducts.filter(p => selectedIds.includes(p.id))
.map(p => ({
id: p.id,
name: p.name ?? p.nom ?? 'Produit',
expirationDate: p.expirationDate ?? p.date ?? null,
}));

// crée le repas
await addDoc(collection(db, 'meals'), {
userId: user.uid,
day,
slot,
name: name.trim() || null,
products: picked,
createdAt: Timestamp.now(),
});

// supprime les produits du frigo utilisés
// tente sur la première collection non vide utilisée plus haut,
// sinon essaie dans l'ordre.
const possibleCols = ['fridge', 'frigo', 'products'];
let usedCol = null;

// Détermine si un des possibles a au moins un doc à ce user (pour éviter 3 delete en boucle)
for (const colName of possibleCols) {
const snap = await getDocs(
query(collection(db, colName), where('userId','==', user.uid))
);
if (!snap.empty) { usedCol = colName; break; }
}
if (!usedCol) usedCol = 'fridge';

for (const id of selectedIds) {
await deleteDoc(doc(db, usedCol, id));
}

setSaving(false);
onSaved?.(); // pour rafraîchir la liste sur la page parente
onClose?.(); // ferme la modale
} catch (e) {
console.error(e);
setSaving(false);
setError("Erreur lors de l'enregistrement du repas.");
}
};

return (
<div
aria-modal="true"
role="dialog"
style={{
position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)',
display: 'flex', alignItems: 'center', justifyContent: 'center',
zIndex: 50
}}
onClick={(e) => {
// click sur l’overlay ferme la modale
if (e.target === e.currentTarget) onClose?.();
}}
>
<div style={{
width: 'min(640px, 92vw)',
background: '#fff',
borderRadius: 12,
padding: 20,
boxShadow: '0 20px 60px rgba(0,0,0,.2)',
maxHeight: '82vh',
overflow: 'auto'
}}>
<div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
<h3 style={{margin:0}}>Ajouter un repas</h3>
<button onClick={onClose} aria-label="Fermer" style={{
border:'none', background:'#f2f2f2', borderRadius:10, width:36, height:36, cursor:'pointer'
}}>×</button>
</div>

{/* Choix jour/slot */}
<div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12}}>
<label style={{display:'grid', gap:6}}>
<span>Jour</span>
<select value={day} onChange={e=>setDay(e.target.value)} style={{padding:'10px 12px', borderRadius:10, border:'1px solid #ddd'}}>
{DAYS.map(d => <option key={d} value={d}>{d}</option>)}
</select>
</label>
<label style={{display:'grid', gap:6}}>
<span>Créneau</span>
<select value={slot} onChange={e=>setSlot(e.target.value)} style={{padding:'10px 12px', borderRadius:10, border:'1px solid #ddd'}}>
{SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
</select>
</label>
</div>

{/* Nom facultatif */}
<label style={{display:'grid', gap:6, marginBottom:16}}>
<span>Nom du repas (facultatif)</span>
<input
placeholder="Ex : Salade de poulet"
value={name}
onChange={e=>setName(e.target.value)}
style={{padding:'12px 14px', borderRadius:12, border:'1px solid #e5e5e5'}}
/>
</label>

{/* Produits du frigo */}
<div style={{display:'grid', gap:10}}>
<strong>Produits du frigo</strong>
{loading && <p style={{opacity:.7}}>Chargement…</p>}

{!loading && nothingInFridge && (
<p style={{opacity:.8}}>Aucun produit trouvé dans le frigo.</p>
)}

{!loading && fridgeProducts.length > 0 && (
<ul style={{listStyle:'none', margin:0, padding:0, display:'grid', gap:8}}>
{fridgeProducts.map(p => {
const label = p.name ?? p.nom ?? '(sans nom)';
const sub = p.expirationDate ? `— exp. ${String(p.expirationDate).slice(0,10)}` : '';
const picked = selectedIds.includes(p.id);
return (
<li key={p.id}>
<label style={{
display:'flex', gap:10, alignItems:'center',
padding:'10px 12px', border:'1px solid #eee',
borderRadius:10, cursor:'pointer',
background: picked ? '#eef6ff' : '#fff'
}}>
<input
type="checkbox"
checked={picked}
onChange={() => togglePick(p.id)}
/>
<span>{label} <span style={{opacity:.6}}>{sub}</span></span>
</label>
</li>
);
})}
</ul>
)}
</div>

{error && <p style={{color:'#d33', marginTop:12}}>{error}</p>}

{/* Actions */}
<div style={{display:'flex', gap:10, justifyContent:'flex-end', marginTop:18}}>
<button onClick={onClose} className="btnGhost">Annuler</button>
<button onClick={handleSave} disabled={saving} className="btnPrimary">
{saving ? 'Enregistrement…' : 'Sauvegarder'}
</button>
</div>
</div>
</div>
);
}
