'use client';

import React, { useEffect, useRef, useState } from 'react';
import { getAuth } from 'firebase/auth';
import {
addDoc, collection, deleteDoc, doc, getDocs, query, where
} from 'firebase/firestore';
import { db } from '../firebase/firebase-config';

const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const SLOTS = ['Déjeuner','Dîner'];

// collections et clés d’utilisateur possibles
const CANDIDATE_COLLECTIONS = ['fridge', 'products', 'frigo', 'items', 'fridgeItems'];
const CANDIDATE_USER_KEYS = ['userId', 'uid', 'ownerId'];

export default function CreateMealModal({ defaultDay, defaultSlot, closeModal }) {
const [day, setDay] = useState(defaultDay || 'Lundi');
const [slot, setSlot] = useState(defaultSlot || 'Déjeuner');
const [name, setName] = useState('');

const [loading, setLoading] = useState(true);
const [loadError, setLoadError] = useState('');
const [debugMsg, setDebugMsg] = useState('');
const [products, setProducts] = useState([]);
const [selectedIds, setSelectedIds] = useState([]);

const overlayRef = useRef(null);

// ESC pour fermer
useEffect(() => {
const onKey = (e) => e.key === 'Escape' && closeModal?.();
document.addEventListener('keydown', onKey);
return () => document.removeEventListener('keydown', onKey);
}, [closeModal]);

const onOverlayClick = (e) => {
if (e.target === overlayRef.current) closeModal?.();
};

// util pour tenter une collection + where, avec fallback sans where
async function loadFromCollection(colName, userUid) {
const colRef = collection(db, colName);

// 1) tenter une requête avec where sur différentes clés
for (const key of CANDIDATE_USER_KEYS) {
try {
const q = query(colRef, where(key, '==', userUid));
const snap = await getDocs(q);
if (!snap.empty) {
return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
// si vide, on continue à tester d’autres clés
} catch (err) {
// règle/index -> on essaie sans where et on filtre client-side
try {
const snap = await getDocs(colRef);
const rows = snap.docs
.map(d => ({ id: d.id, ...d.data() }))
.filter(r => CANDIDATE_USER_KEYS.some(k => r?.[k] === userUid));
if (rows.length) return rows;
} catch (err2) {
// on laisse remonter à la boucle appelante
throw new Error(`Collection "${colName}" lecture impossible: ${err2?.message || err2}`);
}
}
}

// 2) si rien renvoyé avec where, tenter SANS where quoi qu’il arrive
try {
const snap = await getDocs(colRef);
const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
// si aucune clé user, on retourne tout (tu n’as sans doute qu’un frigo par user en dev)
return rows;
} catch (err) {
throw new Error(`Collection "${colName}" lecture impossible: ${err?.message || err}`);
}
}

// charger les produits du frigo
useEffect(() => {
(async () => {
setLoading(true);
setLoadError('');
setDebugMsg('');
try {
const auth = getAuth();
const user = auth.currentUser;
if (!user) throw new Error('Utilisateur non connecté');

let found = [];
let tried = [];

for (const col of CANDIDATE_COLLECTIONS) {
tried.push(col);
try {
const rows = await loadFromCollection(col, user.uid);
if (rows?.length) {
found = rows;
setDebugMsg(`Source: "${col}" (${rows.length} éléments)`);
break;
}
} catch (err) {
// on empile l’info de debug et on tente la suivante
setDebugMsg(prev => (prev ? prev + ' | ' : '') + `${col}: ${err?.message || err}`);
}
}

setProducts(found);
if (!found.length) {
// rien de grave: pas de produits
setDebugMsg(prev => (prev ? prev + ' | ' : '') + `Collections testées: ${tried.join(', ')}`);
}
} catch (err) {
console.error('Load fridge error:', err);
setLoadError("Impossible de charger les produits du frigo.");
setDebugMsg(err?.message || String(err));
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

await addDoc(collection(db, 'meals'), {
userId: user.uid,
day,
slot,
name: name?.trim() || null,
productIds: selectedIds,
createdAt: Date.now()
});

// suppression dans toutes les collections candidates (selon où est stocké ton frigo)
await Promise.all(
CANDIDATE_COLLECTIONS.flatMap(col =>
selectedIds.map(id =>
deleteDoc(doc(db, col, id)).catch(() => null)
)
)
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
{!!debugMsg && <p style={{opacity:.6, fontSize:'.85rem', marginTop:4}}>{debugMsg}</p>}
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
<span className="name">{p.name || p.title || '(sans nom)'}</span>
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
