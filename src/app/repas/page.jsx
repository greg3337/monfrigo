'use client';

import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase/firebase-config';
import {
collection,
onSnapshot,
orderBy,
query,
} from 'firebase/firestore';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import CreateMealModal from './CreateMealModal';

const JOURS = ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];
const MOMENTS = ['midi','soir'];

export default function RepasPage() {
const [user, setUser] = useState(null);
const [meals, setMeals] = useState([]);
const [open, setOpen] = useState(false);
const pathname = usePathname();

// Auth + chargement des repas
useEffect(() => {
let unsubMeals = null;

const unsubAuth = onAuthStateChanged(auth, (u) => {
setUser(u || null);
if (!u) {
setMeals([]);
if (unsubMeals) unsubMeals();
return;
}
const q = query(
collection(db, 'users', u.uid, 'meals'),
orderBy('createdAt', 'desc')
);
unsubMeals = onSnapshot(q, (snap) => {
const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
setMeals(list);
});
});

return () => {
if (unsubMeals) unsubMeals();
unsubAuth();
};
}, []);

const mealsFor = (day, moment) =>
meals.filter((m) => (m.day || '').toLowerCase() === day && (m.moment || '').toLowerCase() === moment);

return (
<div className="repasSimple">
{/* Header */}
<div className="repasHeader">
<div className="title">
<div className="titleLine">
<span className="cube">🍽️</span>
<strong>Planning des repas</strong>
</div>
<div className="hello">
Salut {user?.displayName || user?.email?.split('@')[0] || 'utilisateur'} 👋
</div>
</div>
<div className="actions">
<button className="primary" onClick={() => setOpen(true)}>
+ Composer un repas
</button>
</div>
</div>

{/* Planning par jour + midi/soir */}
<div className="planning">
{JOURS.map((day) => (
<div key={day} className="dayBlock">
<h3 className="dayTitle">📅 {day.charAt(0).toUpperCase() + day.slice(1)}</h3>

<div className="moments">
{MOMENTS.map((moment) => {
const list = mealsFor(day, moment);
return (
<div key={moment} className="momentBlock">
<h4 className="momentTitle">
{moment.charAt(0).toUpperCase() + moment.slice(1)}
</h4>

{list.length === 0 ? (
<p className="emptyMoment">— Aucun repas —</p>
) : (
<ul className="grid" style={{ marginTop: 6 }}>
{list.map((meal) => (
<li key={meal.id} className="item mealCard">
<div className="itemMeta">
<span className="itemName">{meal.name}</span>
<span className="pill">
{(meal.items?.length || 0)} produit(s)
</span>
</div>
</li>
))}
</ul>
)}
</div>
);
})}
</div>
</div>
))}
</div>

{/* Modale */}
{open && <CreateMealModal onClose={() => setOpen(false)} />}

{/* Tabbar bas */}
<nav className="tabbar" role="navigation" aria-label="Navigation principale">
<Link href="/fridge" className={`tab ${pathname.includes('/fridge') ? 'is-active' : ''}`}>
<span className="tab__icon">🧊</span><span className="tab__label">Frigo</span>
</Link>
<Link href="/repas" className={`tab ${pathname.includes('/repas') ? 'is-active' : ''}`}>
<span className="tab__icon">🍽️</span><span className="tab__label">Repas</span>
</Link>
<Link href="/settings" className={`tab ${pathname.includes('/settings') ? 'is-active' : ''}`}>
<span className="tab__icon">⚙️</span><span className="tab__label">Paramètres</span>
</Link>
</nav>
</div>
);
}
