'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { auth, db } from '../firebase/firebase-config';
import { onAuthStateChanged } from 'firebase/auth';
import {
collection,
onSnapshot,
query,
where,
doc,
getDoc,
} from 'firebase/firestore';

import CreateMealModal from './CreateMealModal.jsx';
import './styles/repas.css'; // si tu as déplacé le CSS repas ici. Sinon remplace par './repas.css'

const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const SLOTS = ['Petit-déjeuner', 'Déjeuner', 'Dîner', 'Goûter'];

export default function RepasPage() {
const pathname = usePathname();

const [user, setUser] = useState(null);
const [meals, setMeals] = useState([]); // liste brute Firestore
const [isOpen, setIsOpen] = useState(false);
const [pendingDay, setPendingDay] = useState(null);
const [pendingSlot, setPendingSlot] = useState(null);

// Auth + chargement des repas
useEffect(() => {
const unsubAuth = onAuthStateChanged(auth, (u) => {
setUser(u || null);
if (!u) return;

const q = query(collection(db, 'users', u.uid, 'meals'));
const unsubMeals = onSnapshot(q, (snap) => {
const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
setMeals(list);
});

// petit fetch du profil (si tu veux saluer l'utilisateur par son nom plus tard)
getDoc(doc(db, 'users', u.uid)).catch(() => {});

return () => unsubMeals();
});
return () => unsubAuth();
}, []);

// Regroupe les repas par jour+créneau
const byDaySlot = useMemo(() => {
const map = {};
DAYS.forEach((d) => { map[d] = {}; SLOTS.forEach(s => map[d][s] = []); });
meals.forEach((m) => {
if (map[m.day] && map[m.day][m.slot]) {
map[m.day][m.slot].push(m);
}
});
return map;
}, [meals]);

const openAddMeal = (day, slot) => {
setPendingDay(day);
setPendingSlot(slot);
setIsOpen(true);
};

return (
<>
<div className="repasSimple">
{/* ===== En-tête ===== */}
<div className="repasHeader">
<div className="title">
<div className="titleLine">
<span className="cube">👨‍🍳</span>
<h2>Mes repas</h2>
</div>
<p className="hello">Planifie tes repas de la semaine</p>
</div>
<div className="actions">
<button className="btnPrimary" onClick={() => openAddMeal('Lundi', 'Déjeuner')}>
➕ Créer un repas
</button>
</div>
</div>

{/* ===== Planning ===== */}
<div className="mealPlanner">
{DAYS.map((day) => (
<div key={day} className="dayCard">
<h3 className="dayTitle">{day}</h3>
<div className="slots">
{SLOTS.map((slot) => {
const items = byDaySlot[day]?.[slot] || [];
return (
<div key={slot} className="mealItem">
<div>
<div className="mealItem_slot">{slot}</div>
{items.length === 0 ? (
<div className="mealItem_emptyMeal">Aucun repas planifié</div>
) : (
<div className="mealItem_products">
{items.map((m) => m.name).join(', ')}
</div>
)}
</div>

<button className="btnPrimary" onClick={() => openAddMeal(day, slot)}>
+ Ajouter
</button>
</div>
);
})}
</div>
</div>
))}
</div>

{/* ===== Modale ===== */}
{isOpen && user && (
<CreateMealModal
uid={user.uid}
closeModal={() => setIsOpen(false)}
defaultDay={pendingDay}
defaultSlot={pendingSlot}
/>
)}
</div>

{/* ===== Tabbar en bas ===== */}
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
