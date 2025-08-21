'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { db, auth } from '../firebase/firebase-config';
import {
collection,
query,
where,
getDocs,
orderBy,
deleteDoc,
doc,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

import CreateMealModal from './CreateMealModal.jsx';
import './repas.css';

const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const SLOTS = ['Déjeuner', 'Dîner'];

export default function RepasPage() {
const pathname = usePathname();

const [uid, setUid] = useState(null);
const [loading, setLoading] = useState(true);
const [meals, setMeals] = useState([]); // [{id, day, slot, name, items:[]}]
const [modal, setModal] = useState({ open: false, day: 'Lundi', slot: 'Déjeuner' });

// Auth : garde l'uid
useEffect(() => {
const unsub = onAuthStateChanged(auth, (u) => {
setUid(u ? u.uid : null);
});
return () => unsub();
}, []);

// Charge les repas
const loadMeals = async () => {
if (!uid) return;
setLoading(true);
try {
const q = query(
collection(db, 'users', uid, 'meals'),
where('userId', '==', uid),
orderBy('createdAt', 'desc')
);
const snap = await getDocs(q);
const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
setMeals(rows);
} catch (e) {
console.error('loadMeals error', e);
} finally {
setLoading(false);
}
};

useEffect(() => { loadMeals(); /* eslint-disable-next-line */ }, [uid]);

const grouped = useMemo(() => {
const map = {};
DAYS.forEach((day) => {
map[day] = {};
SLOTS.forEach((s) => { map[day][s] = []; });
});
meals.forEach((m) => {
if (map[m.day] && map[m.day][m.slot]) {
map[m.day][m.slot].push(m);
}
});
return map;
}, [meals]);

const openAdd = (day, slot) => setModal({ open: true, day, slot });
const closeModal = () => setModal((m) => ({ ...m, open: false }));

const handleDelete = async (mealId) => {
if (!uid) return;
try {
await deleteDoc(doc(db, 'users', uid, 'meals', mealId));
await loadMeals();
} catch (e) {
console.error('delete meal failed', e);
alert("Suppression impossible.");
}
};

return (
<>
<div className="repasPage">
<header className="repasHeader">
<div>
<div className="titleLine">
<span className="cube">🍽️</span>
<h2>Mes repas</h2>
</div>
<p className="hello">Planifie tes repas de la semaine</p>
</div>
<button
className="btnPrimary"
onClick={() => openAdd('Lundi','Déjeuner')}
>
➕ Ajouter un repas
</button>
</header>

{loading ? (
<p className="muted">Chargement…</p>
) : (
<div className="weekGrid">
{DAYS.map((day) => (
<section key={day} className="dayCard">
<h3 className="dayTitle">{day}</h3>
<div className="slots">
{SLOTS.map((slot) => (
<div key={slot} className="slotCard">
<div className="slotHeader">
<span className="slotName">{slot}</span>
<button className="linkAdd" onClick={() => openAdd(day, slot)}>+ Ajouter</button>
</div>

<div className="mealsList">
{(grouped[day][slot] || []).length === 0 ? (
<p className="muted">Aucun repas</p>
) : (
grouped[day][slot].map((m) => (
<article key={m.id} className="meal">
<div className="mealName">{m.name || 'Sans nom'}</div>
{Array.isArray(m.items) && m.items.length > 0 && (
<ul className="mealItems">
{m.items.map((it) => (
<li key={it.id || it.name}>• {it.name}</li>
))}
</ul>
)}
<button
className="btnDanger small"
onClick={() => handleDelete(m.id)}
aria-label="Supprimer le repas"
>
Supprimer
</button>
</article>
))
)}
</div>
</div>
))}
</div>
</section>
))}
</div>
)}

{modal.open && (
<CreateMealModal
defaultDay={modal.day}
defaultSlot={modal.slot}
onClose={closeModal}
onSaved={async () => {
closeModal();
await loadMeals();
}}
/>
)}
</div>

{/* Tabbar */}
<nav className="tabbar" role="navigation" aria-label="Navigation principale">
<Link href="/fridge" className={`tab ${pathname?.startsWith('/fridge') ? 'is-active' : ''}`}>
<span className="tab_icon">🧊</span>
<span className="tab_label">Frigo</span>
</Link>
<Link href="/repas" className={`tab ${pathname?.startsWith('/repas') ? 'is-active' : ''}`}>
<span className="tab_icon">🍽️</span>
<span className="tab_label">Repas</span>
</Link>
<Link href="/settings" className={`tab ${pathname?.startsWith('/settings') ? 'is-active' : ''}`}>
<span className="tab_icon">⚙️</span>
<span className="tab_label">Paramètres</span>
</Link>
</nav>
</>
);
}
