'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import CreateMealModal from '../CreateMealModal.jsx';
import { auth, db } from '../firebase/firebase-config';
import {
collection,
onSnapshot,
query,
where,
} from 'firebase/firestore';

const DAYS = ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];

export default function RepasPage() {
const [user, setUser] = useState(null);
const [meals, setMeals] = useState([]);
const [openModal, setOpenModal] = useState(false);
const [search, setSearch] = useState('');

const pathname = usePathname();

// Auth + écoute des repas
useEffect(() => {
const unsubAuth = auth.onAuthStateChanged(u => {
setUser(u || null);
if (!u) { setMeals([]); }
else {
const q = query(
collection(db, 'users', u.uid, 'meals'),
where('deleted', '!=', true) // au cas où
);
const unsubMeals = onSnapshot(q, snap => {
const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
setMeals(list);
});
// nettoie quand l’utilisateur change
return () => unsubMeals();
}
});
return () => unsubAuth();
}, []);

// Recherche (par nom de repas ou produit)
const filteredMeals = useMemo(() => {
const q = search.trim().toLowerCase();
if (!q) return meals;
return meals.filter(m =>
m.name?.toLowerCase().includes(q) ||
(m.products || []).some(p => p.name?.toLowerCase().includes(q))
);
}, [meals, search]);

const mealsFor = (day, slot) =>
filteredMeals.filter(m => m.day === day && m.slot === slot);

const hello =
user?.displayName ||
(user?.email ? user.email.split('@')[0] : 'utilisateur');

return (
<div className="planningContainer">

{/* En-tête */}
<div className="repasHeader">
<div className="title">
<div className="titleLine">
<span className="cube">🧊</span>
<strong>Planning des repas</strong>
</div>
<div className="hello">Salut {hello} 👋</div>
</div>

<div className="actions">
<input
className="search"
placeholder="Rechercher un repas ou un ingrédient…"
value={search}
onChange={e => setSearch(e.target.value)}
/>
<button className="primary" onClick={() => setOpenModal(true)}>
+ Composer un repas
</button>
</div>
</div>

{/* Planning par jour */}
{DAYS.map(day => (
<div key={day} className="dayCard">
<div className="dayHeader">📅 {day[0].toUpperCase() + day.slice(1)}</div>

{/* Midi */}
<div className="mealSlot">
<h3>Midi</h3>
{mealsFor(day, 'midi').length === 0 ? (
<div className="emptyMeal">— Aucun repas —</div>
) : (
mealsFor(day, 'midi').map(m => (
<div key={m.id} className="mealItem">
<span className="mealName">{m.name}</span>
<span className="pill">{(m.products || []).length} produit(s)</span>
</div>
))
)}
</div>

{/* Soir */}
<div className="mealSlot">
<h3>Soir</h3>
{mealsFor(day, 'soir').length === 0 ? (
<div className="emptyMeal">— Aucun repas —</div>
) : (
mealsFor(day, 'soir').map(m => (
<div key={m.id} className="mealItem">
<span className="mealName">{m.name}</span>
<span className="pill">{(m.products || []).length} produit(s)</span>
</div>
))
)}
</div>
</div>
))}

{/* Modale création */}
{openModal && (
<CreateMealModal
closeModal={() => setOpenModal(false)}
/>
)}

{/* Tabbar bas */}
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
