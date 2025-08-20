'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import './repas.css';

import { auth, db } from '../firebase/firebase-config';
import {
collection,
onSnapshot,
query,
where,
orderBy,
doc,
deleteDoc,
} from 'firebase/firestore';

import CreateMealModal from './CreateMealModal.jsx';

const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const SLOTS = ['Déjeuner','Dîner'];

export default function RepasPage() {
const pathname = usePathname();

const [userId, setUserId] = useState(null);
const [meals, setMeals] = useState([]);
const [isOpen, setIsOpen] = useState(false);
const [pendingDay, setPendingDay] = useState(null);
const [pendingSlot, setPendingSlot] = useState(null);

// Qui est connecté ?
useEffect(() => {
const unsub = auth.onAuthStateChanged((u) => setUserId(u ? u.uid : null));
return () => unsub();
}, []);

// Charger les repas en temps réel
useEffect(() => {
if (!userId) return;
const q = query(
collection(db, 'meals'),
where('userId', '==', userId),
orderBy('createdAt', 'desc')
);
const unsub = onSnapshot(q, (snap) => {
const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
setMeals(rows);
});
return () => unsub();
}, [userId]);

const grouped = useMemo(() => {
const map = {};
DAYS.forEach((d) => {
map[d] = {};
SLOTS.forEach((s) => (map[d][s] = []));
});
meals.forEach((m) => {
if (map[m.day] && map[m.day][m.slot]) map[m.day][m.slot].push(m);
});
return map;
}, [meals]);

const openAdd = (day, slot) => {
setPendingDay(day);
setPendingSlot(slot);
setIsOpen(true);
};

const handleDelete = async (mealId) => {
try {
await deleteDoc(doc(db, 'meals', mealId));
} catch (e) {
console.error('Delete meal error:', e);
alert("Impossible de supprimer ce repas.");
}
};

return (
<>
<div className="repasPage wrap">
<header className="repasHeader">
<div className="title">
<div className="titleLine">
<span className="cube" aria-hidden>🍽️</span>
<h2>Mes repas</h2>
</div>
<p className="hello">Planifie tes repas de la semaine</p>
</div>
<div className="actions">
<button
className="btnPrimary"
onClick={() => openAdd('Lundi', 'Déjeuner')}
>
+ Ajouter un repas
</button>
</div>
</header>

{/* Grille hebdomadaire */}
<div className="weekGrid">
{DAYS.map((day) => (
<section key={day} className="dayCard">
<h3 className="dayTitle">{day}</h3>

{SLOTS.map((slot) => (
<div key={slot} className="slotCard">
<div className="slotHeader">
<span className="slotName">{slot}</span>
<button className="linkAdd" onClick={() => openAdd(day, slot)}>
+ Ajouter
</button>
</div>

{grouped[day][slot].length === 0 ? (
<p className="slotEmpty">Aucun repas</p>
) : (
grouped[day][slot].map((m) => (
<article key={m.id} className="mealItem">
<div className="mealMain">
<p className="mealTitle">{m.name || '(sans nom)'}</p>
{Array.isArray(m.products) && m.products.length > 0 && (
<ul className="mealProducts">
{m.products.map((p) => (
<li key={p.id}>{p.name}</li>
))}
</ul>
)}
</div>
<div className="mealActions">
<button
className="btnDanger"
onClick={() => handleDelete(m.id)}
aria-label="Supprimer ce repas"
>
Supprimer
</button>
</div>
</article>
))
)}
</div>
))}
</section>
))}
</div>
</div>

{/* Modale */}
{isOpen && (
<CreateMealModal
defaultDay={pendingDay}
defaultSlot={pendingSlot}
onClose={() => setIsOpen(false)}
/>
)}

{/* Tabbar en bas */}
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
