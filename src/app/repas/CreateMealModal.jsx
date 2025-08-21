'use client';

import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase/firebase-config';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, getDocs, query, where, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';

export default function CreateMealModal({ defaultDay, defaultSlot, onClose, onSaved }) {
const [user, setUser] = useState(null);
const [day, setDay] = useState(defaultDay || 'Lundi');
const [slot, setSlot] = useState(defaultSlot || 'Déjeuner');
const [name, setName] = useState('');
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const [fridgeProducts, setFridgeProducts] = useState([]); // produits Firestore
const [selected, setSelected] = useState([]); // ids sélectionnés

useEffect(() => {
const unsub = onAuthStateChanged(auth, u => setUser(u));
return () => unsub();
}, []);

// Charger les produits du frigo
useEffect(() => {
const load = async () => {
if (!user) return;
setLoading(true);
setError('');
try {
const qProd = query(collection(db, 'fridge'), where('userId', '==', user.uid));
const snap = await getDocs(qProd);
const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
setFridgeProducts(rows);
} catch (e) {
setError("Impossible de charger les produits du frigo.");
} finally {
setLoading(false);
}
};
load();
}, [user]);

const toggle = (id) => {
setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
};

const save = async () => {
if (!user) return;
try {
setError('');
// construire les produits choisis
const chosen = fridgeProducts.filter(p => selected.includes(p.id))
.map(p => ({ id: p.id, name: p.name }));

// 1) créer le repas
const ref = await addDoc(collection(db, 'meals'), {
userId: user.uid,
day,
slot,
name: name.trim(),
products: chosen,
createdAt: serverTimestamp()
});

// 2) supprimer du frigo les produits utilisés
await Promise.all(chosen.map(p => deleteDoc(doc(db, 'fridge', p.id))));

// 3) notifier parent (facultatif, onSnapshot suffit déjà)
onSaved?.({ id: ref.id, userId: user.uid, day, slot, name, products: chosen });

onClose?.();
} catch (e) {
console.error(e);
setError("Échec de l’enregistrement du repas.");
}
};

return (
<div className="modalOverlay">
<div className="modal">
<div className="modalHeader">
<h3>Ajouter un repas</h3>
<button className="btnGhost" onClick={() => onClose?.()}>×</button>
</div>

<div className="modalBody">
<div className="row">
<label>Jour</label>
<select value={day} onChange={e=>setDay(e.target.value)}>
{['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'].map(d=>(
<option key={d} value={d}>{d}</option>
))}
</select>
<label>Créneau</label>
<select value={slot} onChange={e=>setSlot(e.target.value)}>
{['Déjeuner','Dîner'].map(s=>(
<option key={s} value={s}>{s}</option>
))}
</select>
</div>

<label>Nom du repas (facultatif)</label>
<input
type="text"
placeholder="Ex : Salade de poulet"
value={name}
onChange={e=>setName(e.target.value)}
/>

<h4>Produits du frigo</h4>
{loading ? (
<p className="muted">Chargement…</p>
) : fridgeProducts.length === 0 ? (
<p className="muted">Aucun produit trouvé dans le frigo.</p>
) : (
<ul className="productList">
{fridgeProducts.map(p=>(
<li key={p.id}>
<label>
<input
type="checkbox"
checked={selected.includes(p.id)}
onChange={() => toggle(p.id)}
/>
<span>{p.name}</span>
</label>
</li>
))}
</ul>
)}

{error && <p style={{color:'#dc3545'}}>{error}</p>}
</div>

<div className="modalActions">
<button className="btnGhost" onClick={()=>onClose?.()}>Annuler</button>
<button className="primary" onClick={save}>Sauvegarder</button>
</div>
</div>
</div>
);
}
