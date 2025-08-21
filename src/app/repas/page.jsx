'use client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React, { useEffect, useMemo, useState } from 'react';
import './repas.css';
import { db } from '@/app/firebase/firebase-config';
import {
addDoc,
collection,
deleteDoc,
doc,
getDocs,
orderBy,
query,
serverTimestamp,
} from 'firebase/firestore';
import { useAuth } from '@/app/hooks/useAuth';
import CreateMealModal from './CreateMealModal';

const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const SLOTS = ['Déjeuner','Dîner'];

export default function MealsPage() {
const { user } = useAuth();
const [loading, setLoading] = useState(true);
const [meals, setMeals] = useState([]); // {id, day, slot, name, items[]}
const [modal, setModal] = useState(null); // {day, slot} | null
const [error, setError] = useState('');

// -----------------------------
// Utilitaires Firestore
// -----------------------------
async function readFridge(userId) {
// essaie plusieurs noms de sous-collection selon tes anciennes versions
const candidates = ['fridge', 'products', 'frigo', 'items', 'fridgeItems'];
const all = [];
const tried = [];
for (const sub of candidates) {
try {
const q = query(collection(db, 'users', userId, sub), orderBy('createdAt','desc'));
const snap = await getDocs(q);
if (!snap.empty) {
snap.forEach(d => {
const data = d.data() || {};
all.push({
id: d.id,
name: data.name || data.label || data.title || 'Produit',
// garde l’info pour savoir dans quelle collection le supprimer
_collection: sub,
});
});
}
tried.push(sub);
} catch {
tried.push(sub);
// on ignore – la collection peut ne pas exister
}
}
return { items: all, tried };
}

async function readMeals(userId) {
const q = query(collection(db, 'users', userId, 'meals'), orderBy('createdAt','desc'));
const snap = await getDocs(q);
return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function saveMeal(userId, payload) {
// 1) créer le repas
await addDoc(collection(db, 'users', userId, 'meals'), {
...payload, // {day, slot, name, items:[{id,name,_collection}]}
createdAt: serverTimestamp(),
});
// 2) supprimer les produits utilisés du frigo
const deletions = (payload.items || []).map(it => {
if (!it._collection || !it.id) return Promise.resolve();
return deleteDoc(doc(db, 'users', userId, it._collection, it.id));
});
await Promise.allSettled(deletions);
}

// -----------------------------
// Chargement
// -----------------------------
const grouped = useMemo(() => {
const map = {};
DAYS.forEach(d => {
map[d] = {};
SLOTS.forEach(s => { map[d][s] = []; });
});
meals.forEach(m => {
if (map[m.day] && map[m.day][m.slot]) map[m.day][m.slot].push(m);
});
return map;
}, [meals]);

useEffect(() => {
if (!user) return;
let cancelled = false;
(async () => {
try {
setLoading(true);
const list = await readMeals(user.uid);
if (!cancelled) setMeals(list);
} catch (e) {
if (!cancelled) setError("Impossible de charger les repas.");
} finally {
if (!cancelled) setLoading(false);
}
})();
return () => { cancelled = true; };
}, [user]);

async function handleCreate({ day, slot, name, selectedItems }) {
if (!user) return;
await saveMeal(user.uid, {
day, slot, name: (name || '').trim(),
items: selectedItems,
});
// recharger
const list = await readMeals(user.uid);
setMeals(list);
}

return (
<main className="meals_wrap">
<header className="meals_header">
<div className="title">
<span className="ico">🍽️</span>
<div>
<h1>Mes repas</h1>
<p>Planifie tes repas de la semaine</p>
</div>
</div>
<button
className="btnPrimary"
onClick={() => setModal({ day: 'Lundi', slot: 'Déjeuner' })}
>
+ Ajouter un repas
</button>
</header>

{error && <div className="alert error">{error}</div>}

{loading ? (
<div className="loading">Chargement…</div>
) : (
<section className="grid">
{DAYS.map((day) => (
<div className="day" key={day}>
<h3>{day}</h3>

{SLOTS.map(slot => (
<div className="slotCard" key={slot}>
<div className="slotHead">
<strong>{slot}</strong>
<button className="linkAdd" onClick={() => setModal({ day, slot })}>
+ Ajouter
</button>
</div>

<div className="slotBody">
{grouped[day][slot].length === 0 ? (
<p className="muted">Aucun repas</p>
) : (
grouped[day][slot].map(m => (
<div className="mealItem" key={m.id}>
<div className="mealTitle">{m.name || 'Repas'}</div>
{Array.isArray(m.items) && m.items.length > 0 && (
<ul className="mealSub">
{m.items.map((it, idx) => (
<li key={idx}>• {it.name}</li>
))}
</ul>
)}
</div>
))
)}
</div>
</div>
))}
</div>
))}
</section>
)}

{modal && user && (
<CreateMealModal
userId={user.uid}
defaultDay={modal.day}
defaultSlot={modal.slot}
onClose={() => setModal(null)}
onSaved={async () => {
const list = await readMeals(user.uid);
setMeals(list);
setModal(null);
}}
loadFridge={readFridge}
onSaveMeal={handleCreate}
/>
)}
</main>
);
}
