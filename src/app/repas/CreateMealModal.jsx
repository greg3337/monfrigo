'use client';

import { useEffect, useMemo, useState } from 'react';
import {
collection,
doc,
getDocs,
addDoc,
deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase/firebase-config';
import { useAuth } from '../hooks/useAuth';

const DAY_LABELS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const SLOT_LABELS = ['Déjeuner','Dîner'];

export default function CreateMealModal({
onClose,
defaultDay = 'Lundi',
defaultSlot = 'Déjeuner',
onCreated, // callback optionnel pour rafraîchir la liste
}) {
const { user } = useAuth();
const [day, setDay] = useState(defaultDay);
const [slot, setSlot] = useState(defaultSlot);
const [name, setName] = useState('');
const [loading, setLoading] = useState(true);
const [loadMsg, setLoadMsg] = useState('Chargement des produits…');
const [error, setError] = useState('');
const [products, setProducts] = useState([]); // [{id, name, expirationDate}]
const [selectedIds, setSelectedIds] = useState(new Set());

// ferme si on clique en dehors
useEffect(() => {
const onKey = (e) => e.key === 'Escape' && onClose?.();
window.addEventListener('keydown', onKey);
return () => window.removeEventListener('keydown', onKey);
}, [onClose]);

// charge les produits du frigo sous users/{uid}/…
useEffect(() => {
let cancelled = false;

async function loadFridge() {
if (!user?.uid) {
setError("Utilisateur non connecté.");
setLoading(false);
return;
}

setLoading(true);
setError('');
setLoadMsg('Chargement des produits…');

const candidateCollections = ['fridge', 'items', 'products', 'frigo'];
const found = [];
let usedCollection = null;

try {
for (const colName of candidateCollections) {
const snap = await getDocs(collection(doc(db, 'users', user.uid), colName));
if (!cancelled && !snap.empty && found.length === 0) {
usedCollection = colName;
snap.forEach((d) => {
const data = d.data();
found.push({
id: d.id,
name: data.name ?? data.title ?? data.label ?? 'Sans nom',
expirationDate: data.expirationDate ?? null,
});
});
break; // on prend la première qui contient des docs
}
}

if (cancelled) return;

if (found.length === 0) {
setProducts([]);
setLoadMsg("Aucun produit trouvé sous users/{uid}/(fridge|items|products|frigo). Ajoute d’abord des produits dans l’onglet Frigo.");
} else {
setProducts(found);
setLoadMsg(`Produits chargés depuis “${usedCollection}” (${found.length}).`);
}
} catch (e) {
if (cancelled) return;
console.error('[CreateMealModal] loadFridge error:', e);
setError('Impossible de charger les produits du frigo (vérifie tes règles Firestore et l’emplacement des données).');
} finally {
if (!cancelled) setLoading(false);
}
}

loadFridge();
return () => { cancelled = true; };
}, [user?.uid]);

const toggleSelect = (id) => {
setSelectedIds((prev) => {
const copy = new Set(prev);
if (copy.has(id)) copy.delete(id); else copy.add(id);
return copy;
});
};

const canSave = useMemo(
() => !!user?.uid && day && slot && (name.trim().length > 0 || selectedIds.size > 0),
[user?.uid, day, slot, name, selectedIds]
);

const onSave = async () => {
if (!canSave) return;
try {
const uid = user.uid;
// 1) Créer le repas
await addDoc(collection(doc(db, 'users', uid), 'meals'), {
day,
slot,
name: name.trim() || null,
items: Array.from(selectedIds),
createdAt: Date.now(),
});

// 2) Supprimer les produits consommés
if (selectedIds.size > 0) {
const paths = ['fridge', 'items', 'products', 'frigo'];
for (const colName of paths) {
// on tente la suppression dans chaque col, au cas où
for (const id of selectedIds) {
try {
await deleteDoc(doc(doc(db, 'users', uid), colName, id));
} catch {
// ignore si le doc n’existe pas dans cette collection
}
}
}
}

onCreated?.(); // rafraîchir la liste si fourni
onClose?.();
} catch (e) {
console.error('[CreateMealModal] save error:', e);
setError("Impossible d'enregistrer le repas.");
}
};

return (
<div
role="dialog"
aria-modal="true"
className="modalOverlay"
onClick={(e) => {
if (e.target.classList.contains('modalOverlay')) onClose?.();
}}
style={{
position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
display: 'grid', placeItems: 'center', zIndex: 1000
}}
>
<div
className="modalCard"
style={{
width: 'min(720px, 92vw)',
background: '#fff',
borderRadius: 12,
boxShadow: '0 10px 30px rgba(0,0,0,.2)',
padding: 20,
position: 'relative'
}}
>
<button
aria-label="Fermer"
onClick={() => onClose?.()}
style={{
position: 'absolute', top: 10, right: 10,
background: '#f4f4f5', border: '1px solid #e4e4e7',
borderRadius: 8, width: 32, height: 32, cursor: 'pointer'
}}
>
×
</button>

<h3 style={{ margin: '4px 0 16px', fontSize: 20, fontWeight: 700 }}>Ajouter un repas</h3>

{/* Jour & créneau */}
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
<div>
<label style={{ fontSize: 14, fontWeight: 600 }}>Jour</label>
<select value={day} onChange={(e) => setDay(e.target.value)} style={selectStyle}>
{DAY_LABELS.map(d => <option key={d} value={d}>{d}</option>)}
</select>
</div>
<div>
<label style={{ fontSize: 14, fontWeight: 600 }}>Créneau</label>
<select value={slot} onChange={(e) => setSlot(e.target.value)} style={selectStyle}>
{SLOT_LABELS.map(s => <option key={s} value={s}>{s}</option>)}
</select>
</div>
</div>

{/* Nom facultatif */}
<div style={{ marginTop: 12 }}>
<label style={{ fontSize: 14, fontWeight: 600 }}>Nom du repas (facultatif)</label>
<input
value={name}
onChange={(e) => setName(e.target.value)}
placeholder="Ex : Salade de poulet"
style={inputStyle}
/>
</div>

{/* Produits du frigo */}
<div style={{ marginTop: 16 }}>
<div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Produits du frigo</div>

{loading && <p style={{ color: '#6b7280' }}>{loadMsg}</p>}
{!loading && error && <p style={{ color: '#dc2626' }}>{error}</p>}

{!loading && !error && products.length === 0 && (
<p style={{ color: '#6b7280' }}>
{loadMsg || "Aucun produit trouvé dans le frigo."}
</p>
)}

{!loading && products.length > 0 && (
<ul style={{ listStyle: 'none', padding: 0, margin: '8px 0', maxHeight: 220, overflow: 'auto' }}>
{products.map((p) => {
const checked = selectedIds.has(p.id);
return (
<li key={p.id} style={{
display: 'flex', alignItems: 'center', gap: 10,
padding: '8px 10px', border: '1px solid #eee',
borderRadius: 8, marginBottom: 8
}}>
<input
type="checkbox"
checked={checked}
onChange={() => toggleSelect(p.id)}
/>
<div style={{ flex: 1 }}>
<div style={{ fontWeight: 600 }}>{p.name}</div>
{p.expirationDate && (
<div style={{ fontSize: 12, color: '#6b7280' }}>
DLC : {p.expirationDate}
</div>
)}
</div>
</li>
);
})}
</ul>
)}
</div>

{/* Actions */}
<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
<button
onClick={() => onClose?.()}
style={ghostBtn}
>
Annuler
</button>
<button
disabled={!canSave}
onClick={onSave}
style={{ ...primaryBtn, opacity: canSave ? 1 : 0.5, cursor: canSave ? 'pointer' : 'not-allowed' }}
>
Sauvegarder
</button>
</div>
</div>
</div>
);
}

/* petits styles inline réutilisables */
const selectStyle = {
width: '100%',
height: 40,
borderRadius: 10,
border: '1px solid #e5e7eb',
background: '#fff',
padding: '0 10px',
fontSize: 14,
};
const inputStyle = {
width: '100%', height: 42, borderRadius: 10, border: '1px solid #e5e7eb',
background: '#fff', padding: '0 12px', fontSize: 14,
};
const primaryBtn = {
minWidth: 120, height: 40, borderRadius: 10, border: '1px solid #0ea5e9',
background: '#22d3ee', color: '#0b1221', fontWeight: 700
};
const ghostBtn = {
minWidth: 120, height: 40, borderRadius: 10, border: '1px solid #e5e7eb',
background: '#fff', color: '#0b1221', fontWeight: 600
};
