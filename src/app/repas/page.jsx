'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { auth, db } from '../../firebase/firebase-config';
import { onAuthStateChanged } from 'firebase/auth';
import {collection,query,where,onSnapshot,addDoc,serverTimestamp,deleteDoc,doc,} from 'firebase/firestore';
import CreateMealModal from './CreateMealModal.jsx';
import './repas.css';

const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const SLOTS = ['Déjeuner','Dîner'];

export default function RepasPage() {
const pathname = usePathname();

const [user, setUser] = useState(null);
const [meals, setMeals] = useState([]); // {id, day, slot, name}
const [loading, setLoading] = useState(true);
const [showModal, setShowModal] = useState(false);
const [pendingDay, setPendingDay] = useState('Lundi');
const [pendingSlot, setPendingSlot] = useState('Déjeuner');

// Auth
useEffect(() => {
const unsub = onAuthStateChanged(auth, (u) => setUser(u));
return () => unsub();
}, []);

// Live meals for user
useEffect(() => {
if (!user) return;
setLoading(true);
const qMeals = query(
collection(db, 'meals'),
where('userId', '==', user.uid)
);
const unsub = onSnapshot(
qMeals,
(snap) => {
const arr = [];
snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
setMeals(arr);
setLoading(false);
},
(err) => {
console.error('onSnapshot(meals) error:', err);
setMeals([]);
setLoading(false);
}
);
return () => unsub();
}, [user]);

const openAdd = (day, slot) => {
setPendingDay(day);
setPendingSlot(slot);
setShowModal(true);
};

const grouped = useMemo(() => {
const m = {};
for (const day of DAYS) {
m[day] = { Déjeuner: [], Dîner: [] };
}
for (const meal of meals) {
if (m[meal.day] && m[meal.day][meal.slot]) {
m[meal.day][meal.slot].push(meal);
}
}
return m;
}, [meals]);

const deleteMeal = async (id) => {
try {
await deleteDoc(doc(db, 'meals', id));
} catch (e) {
console.error('deleteMeal error', e);
alert("Suppression impossible pour l’instant.");
}
};

return (
<>
<div className="repas">
<div className="repasHeader">
<div>
<div className="titleLine">
<span className="cube">🍽️</span>
<h2>Mes repas</h2>
</div>
<p className="hello">Planifie tes repas de la semaine</p>
</div>
<div>
<button
className="btnPrimary"
onClick={() => openAdd('Lundi', 'Déjeuner')}
disabled={!user}
title={!user ? 'Connecte-toi pour créer un repas' : 'Créer un repas'}
>
➕ Ajouter un repas
</button>
</div>
</div>

{/* Grille hebdo */}
<div className="weekGrid">
{DAYS.map((day) => (
<section key={day} className="dayCard">
<header className="dayTitle">{day}</header>

{SLOTS.map((slot) => (
<div key={slot} className="slot">
<div className="slotHeader">
<span className="slotName">{slot}</span>
<button
className="linkAdd"
onClick={() => openAdd(day, slot)}
disabled={!user}
>
+ Ajouter
</button>
</div>

<div className="slotBody">
{(grouped[day]?.[slot] ?? []).length === 0 ? (
<div className="empty">Aucun repas</div>
) : (
(grouped[day][slot]).map((meal) => (
<div key={meal.id} className="mealItem">
<div className="mealName">{meal.name || 'Repas'}</div>
<button
className="btnDanger"
onClick={() => deleteMeal(meal.id)}
>
Supprimer
</button>
</div>
))
)}
</div>
</div>
))}
</section>
))}
</div>

{loading && <p className="muted">Chargement…</p>}

{showModal && user && (
<CreateMealModal
user={user}
defaultDay={pendingDay}
defaultSlot={pendingSlot}
onClose={() => setShowModal(false)}
onSaved={() => setShowModal(false)}
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
