'use client';
import React, { useEffect, useMemo, useState } from 'react';
import {
collection, query, where, getDocs, addDoc, writeBatch, doc,
} from 'firebase/firestore';
import { db } from '../firebase/firebase-config';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const FRIDGE_COLLECTION = 'fridge'; // ← change en 'frigo' si besoin
const MEALS_COLLECTION = 'meals';

const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const SLOTS = ['Petit-déjeuner','Déjeuner','Dîner','Goûter'];

export default function CreateMealModal({ onClose, defaultDay, defaultSlot }) {
const [authUser, setAuthUser] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const [products, setProducts] = useState([]);
const [day, setDay] = useState(defaultDay || 'Lundi');
const [slot, setSlot] = useState(defaultSlot || 'Déjeuner');
const [name, setName] = useState('');
const [selected, setSelected] = useState([]); // tableau d'ids produit
const canSave = useMemo(() => !!authUser && (selected.length > 0 || name.trim().length > 0), [authUser, selected, name]);

// --- Auth ---
useEffect(() => {
const auth = getAuth();
return onAuthStateChanged(auth, (u) => setAuthUser(u || null));
}, []);

// --- Charger les produits du frigo ---
useEffect(() => {
if (!authUser) return;
setLoading(true);
setError('');
(async () => {
try {
// 1) essaie avec la collection FRIDGE_COLLECTION
const q1 = query(collection(db, FRIDGE_COLLECTION), where('userId', '==', authUser.uid));
let snap = await getDocs(q1);

// 2) si vide, essaie la variante FR / EN (utile si renommage)
if (snap.empty && FRIDGE_COLLECTION !== 'frigo') {
const q2 = query(collection(db, 'frigo'), where('userId', '==', authUser.uid));
snap = await getDocs(q2);
}

const list = [];
snap.forEach(d => list.push({ id: d.id, ...d.data() }));
setProducts(list);
} catch (e) {
console.error(e);
setError("Impossible de charger les produits du frigo.");
} finally {
setLoading(false);
}
})();
}, [authUser]);

const toggleSelect = (id) => {
setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
};

// --- Sauvegarde ---
const onSave = async () => {
if (!authUser) return;
try {
const batch = writeBatch(db);

// 1) créer le repas
const mealDoc = {
userId: authUser.uid,
day,
slot,
name: name.trim() || null,
productIds: selected,
createdAt: new Date(),
};
await addDoc(collection(db, MEALS_COLLECTION), mealDoc);

// 2) supprimer du frigo les produits utilisés
selected.forEach((pid) => {
batch.delete(doc(db, FRIDGE_COLLECTION, pid));
});
await batch.commit();

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
<button className="btnClose" onClick={onClose}>×</button>
</div>

{!authUser && (
<p className="hint">Veuillez vous connecter pour ajouter un repas.</p>
)}

<div className="formRow">
<label>Jour</label>
<select value={day} onChange={e => setDay(e.target.value)}>
{DAYS.map(d => <option key={d} value={d}>{d}</option>)}
</select>

<label>Créneau</label>
<select value={slot} onChange={e => setSlot(e.target.value)}>
{SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
</select>
</div>

<div className="formRow">
<label>Nom du repas (facultatif)</label>
<input
type="text"
placeholder="Ex : Salade de poulet"
value={name}
onChange={e => setName(e.target.value)}
/>
</div>

<div className="formRow">
<label>Produits du frigo</label>
{loading && <p className="muted">Chargement…</p>}
{!loading && error && <p className="error">{error}</p>}
{!loading && !error && products.length === 0 && (
<p className="muted">
Aucun produit trouvé pour ce compte.
Vérifie que la collection s’appelle <code>{FRIDGE_COLLECTION}</code> et que les produits ont bien un champ <code>userId</code>.
</p>
)}
{!loading && products.length > 0 && (
<ul className="productList">
{products.map(p => (
<li key={p.id}>
<label className="checkline">
<input
type="checkbox"
checked={selected.includes(p.id)}
onChange={() => toggleSelect(p.id)}
/>
<span>
{p.name || 'Produit'} {p.expirationDate ? `• ${p.expirationDate}` : ''}
</span>
</label>
</li>
))}
</ul>
)}
</div>

<div className="modalActions">
<button className="btnGhost" onClick={onClose}>Annuler</button>
<button className="btnPrimary" disabled={!canSave} onClick={onSave}>
Sauvegarder
</button>
</div>
</div>
</div>
);
}
