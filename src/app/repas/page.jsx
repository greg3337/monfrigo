'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { auth, db } from '../firebase/firebase-config';
import {collection,onSnapshot,query,} from 'firebase/firestore';

import CreateMealModal from './CreateMealModal.jsx';
import './repas.css';

const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const SLOTS = ['Petit-déjeuner','Déjeuner','Dîner','Goûter'];

function normalizeDay(d) {
if (!d) return '';
const map = { lundi:'Lundi', mardi:'Mardi', mercredi:'Mercredi', jeudi:'Jeudi', vendredi:'Vendredi', samedi:'Samedi', dimanche:'Dimanche' };
const k = d.toString().trim().toLowerCase();
return map[k] || d;
}
function normalizeSlot(s, moment) {
const v = (s || moment || '').toString().trim().toLowerCase();
if (['petit-déjeuner','petit dejeuner','petitdejeuner','matin'].includes(v)) return 'Petit-déjeuner';
if (['dejeuner','déjeuner','midi'].includes(v)) return 'Déjeuner';
if (['diner','dîner','soir'].includes(v)) return 'Dîner';
if (['gouter','goûter'].includes(v)) return 'Goûter';
return s || moment || '';
}

export default function RepasPage() {
const pathname = usePathname();
const [isOpen, setIsOpen] = useState(false);
const [pendingDay, setPendingDay] = useState('Lundi');
const [pendingSlot, setPendingSlot] = useState('Déjeuner');

const [user, setUser] = useState(null);
const [meals, setMeals] = useState([]);

// Auth + écoute temps réel des repas
useEffect(() => {
const unsubAuth = auth.onAuthStateChanged((u) => {
setUser(u || null);
if (!u) { setMeals([]); return; }

const q = query(collection(db, 'users', u.uid, 'meals'));
const unsubMeals = onSnapshot(q, (snap) => {
const list = snap.docs.map((d) => {
const x = d.data();
return {
id: d.id,
name: x.name || x.title || '',
day: normalizeDay(x.day || x.jour),
slot: normalizeSlot(x.slot, x.moment),
products: x.products || x.items || [],
};
});
setMeals(list);
});

return () => unsubMeals();
});
return () => unsubAuth();
}, []);

// indexation jour|slot -> liste
const mealsByKey = useMemo(() => {
const m = {};
meals.forEach((x) => {
const key = `${normalizeDay(x.day)}|${normalizeSlot(x.slot, x.moment)}`;
if (!m[key]) m[key] = [];
m[key].push(x);
});
return m;
}, [meals]);

const getMealsFor = (day, slot) => mealsByKey[`${day}|${slot}`] || [];

const openAddMeal = (day, slot) => {
setPendingDay(day);
setPendingSlot(slot);
setIsOpen(true);
};

return (
<>
<div className="repasSimple">
{/* Header */}
<div className="repasHeader">
<div className="title">
<div className="titleLine">
<span className="cube">🍽️</span>
<span className="brandTitle">Mes repas</span>
</div>
<div className="hello">
{user ? `Salut ${user.displayName || user.email?.split('@')[0] || 'utilisateur'} 👋`
: 'Connecte-toi pour planifier tes repas'}
</div>
</div>
<div className="actions">
<button className="primary" onClick={() => openAddMeal('Lundi','Déjeuner')} disabled={!user}>
➕ Créer un repas
</button>
</div>
</div>

{/* Planning hebdo */}
{DAYS.map((day) => (
<div key={day} className="dayCard">
<div className="dayTitle">{day}</div>

{SLOTS.map((slot) => {
const list = getMealsFor(day, slot);
const summary = list.map((m) => m.name || 'Repas').join(', ');
return (
<div key={slot} className="mealItem" onClick={() => user && openAddMeal(day, slot)}>
<div className="slot">{slot}</div>
{list.length === 0 ? (
<div className="emptyMeal">Aucun repas planifié</div>
) : (
<div className="products">{summary}</div>
)}
<button
type="button"
onClick={(e) => { e.stopPropagation(); user && openAddMeal(day, slot); }}
disabled={!user}
>
+ Ajouter un repas
</button>
</div>
);
})}
</div>
))}

{/* Modale */}
{isOpen && (
<CreateMealModal
closeModal={() => setIsOpen(false)}
defaultDay={pendingDay}
defaultSlot={pendingSlot}
/>
)}
</div>

{/* Tabbar (attention au chemin: /fridge) */}
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
