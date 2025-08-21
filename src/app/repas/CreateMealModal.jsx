'use client';

import React, { useEffect, useState } from 'react';
import { db } from '../firebase/firebase-config';
import {
collection,
getDocs,
addDoc,
serverTimestamp,
deleteDoc,
doc,
} from 'firebase/firestore';
import useAuth from '../hooks/useAuth';

const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const SLOTS = ['Déjeuner','Dîner'];

export default function CreateMealModal({ defaultDay='Lundi', defaultSlot='Déjeuner', onClose, onSaved }) {
const { user } = useAuth();

const [day, setDay] = useState(defaultDay);
const [slot, setSlot] = useState(defaultSlot);
const [name, setName] = useState('');
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const [fridgeItems, setFridgeItems] = useState([]);
const [selectedIds, setSelectedIds] = useState([]);

// Charge les produits du frigo de l’utilisateur
useEffect(() => {
if (!user) return;
(async () => {
try {
setError('');
setLoading(true);
const snap = await getDocs(collection(db, 'users', user.uid, 'fridge'));
const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
setFridgeItems(items);
} catch (e) {
setError("Impossible de charger les produits du frigo.");
} finally {
setLoading(false);
}
})();
}, [user]);

function toggleSelect(id) {
setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
}

async function save() {
if (!user) return;
try {
setError('');
// produits choisis (nom + id) pour affichage dans la liste
const picked = fridgeItems.filter(i => selectedIds.includes(i.id))
.map(i => ({ id: i.id, name: i.name || i.label || '—' }));

await addDoc(collection(db, 'users', user.uid, 'meals'), {
day, slot, name: name.trim(),
products: picked,
createdAt: serverTimestamp(),
});

// supprimer du frigo les produits utilisés
for (const id of selectedIds) {
await deleteDoc(doc(db, 'users', user.uid, 'fridge', id));
}

onSaved && onSaved();
} catch (e) {
setError("Échec de l’enregistrement du repas.");
}
}

return (
<div className="modal_backdrop" onClick={onClose}>
<div className="modal" onClick={(e)=>e.stopPropagation()}>
<div className="modal_header">
<h3>Ajouter un repas</h3>
<button className="close" onClick={onClose}>×</button>
</div>

<div className="gridTwo">
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

<label>
Nom du repas (facultatif)
<input
placeholder="Ex : Salade de poulet"
value={name}
onChange={e=>setName(e.target.value)}
/>
</label>

<h4 className="sectionTitle">Produits du frigo</h4>
{loading && <p>Chargement…</p>}
{!loading && fridgeItems.length === 0 && (
<p>Aucun produit trouvé dans le frigo.</p>
)}

{!loading && fridgeItems.length > 0 && (
<ul className="fridgeList">
{fridgeItems.map(p => (
<li key={p.id} className="checkLine">
<label>
<input
type="checkbox"
checked={selectedIds.includes(p.id)}
onChange={() => toggleSelect(p.id)}
/>
<span>{p.name || p.label}</span>
</label>
{p.expirationDate && (
<span className="muted">{p.expirationDate}</span>
)}
</li>
))}
</ul>
)}

{error && <p className="error">{error}</p>}

<div className="modalActions">
<button className="btnGhost" onClick={onClose}>Annuler</button>
<button className="btnPrimary" onClick={save}>Sauvegarder</button>
</div>
</div>
</div>
);
}
