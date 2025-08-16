'use client';

import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase/firebase-config';
import { collection, onSnapshot, query } from 'firebase/firestore';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import CreateMealModal from './CreateMealModal';

const JOURS = [
'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche',
];

export default function RepasPage() {
const [user, setUser] = useState(null);
const [meals, setMeals] = useState([]);
const [openDay, setOpenDay] = useState(null); // jour pour l’ajout
const pathname = usePathname();

// Auth + chargement des repas
useEffect(() => {
let unsubscribeMeals = null;

const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
setUser(u);
if (!u) {
setMeals([]);
if (unsubscribeMeals) unsubscribeMeals();
return;
}

const q = query(collection(db, 'users', u.uid, 'meals'));
unsubscribeMeals = onSnapshot(q, (snap) => {
const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
setMeals(list);
});
});

return () => {
if (unsubscribeMeals) unsubscribeMeals();
unsubscribeAuth();
};
}, []);

const mealsFor = (day) => meals.filter((m) => m.day === day);

return (
<div className="page repasPage">
<h2>📅 Planning des repas</h2>

<div className="planning">
{JOURS.map((day) => (
<div key={day} className="dayBlock">
<div className="dayHeader">
<h3>{day.charAt(0).toUpperCase() + day.slice(1)}</h3>
<button className="primary" onClick={() => setOpenDay(day)}>➕</button>
</div>

<ul className="mealList">
{mealsFor(day).length === 0 && (
<li className="empty">Aucun repas</li>
)}
{mealsFor(day).map((meal) => (
<li key={meal.id} className="mealCard">
<div className="mealName">{meal.name}</div>
{Array.isArray(meal.items) && meal.items.length > 0 && (
<ul className="mealItems">
{meal.items.map((it) => (
<li key={it.productId || it.name}>{it.name}</li>
))}
</ul>
)}
</li>
))}
</ul>
</div>
))}
</div>

{openDay && (
<CreateMealModal
selectedDay={openDay}
close={() => setOpenDay(null)}
/>
)}

{/* --- Tabbar --- */}
<nav className="tabbar" role="navigation" aria-label="Navigation principale">
<Link href="/fridge" className={`tab ${pathname.includes('/fridge') ? 'is-active' : ''}`}>
<span className="tab__icon">🧊</span>
<span className="tab__label">Frigo</span>
</Link>

<Link href="/repas" className={`tab ${pathname.includes('/repas') ? 'is-active' : ''}`}>
<span className="tab__icon">🍽️</span>
<span className="tab__label">Repas</span>
</Link>

<Link href="/settings" className={`tab ${pathname.includes('/settings') ? 'is-active' : ''}`}>
<span className="tab__icon">⚙️</span>
<span className="tab__label">Paramètres</span>
</Link>
</nav>
</div>
);
}
