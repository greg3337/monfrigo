'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { auth, db } from '../firebase/firebase-config';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import CreateMealModal from './CreateMealModal.jsx';
import './repas.css';

const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const SLOTS = ['Déjeuner','Dîner'];

export default function RepasPage(){
const pathname = usePathname();
const [user, setUser] = useState(null);
const [meals, setMeals] = useState([]);
const [isOpen, setIsOpen] = useState(false);
const [pendingDay, setPendingDay] = useState(null);
const [pendingSlot, setPendingSlot] = useState(null);

// 1) état auth
useEffect(() => {
const unsub = onAuthStateChanged(auth, u => setUser(u));
return () => unsub();
}, []);

// 2) abonnement temps réel aux repas de l’utilisateur
useEffect(() => {
if (!user) return;
const q = query(
collection(db, 'meals'),
where('userId', '==', user.uid),
orderBy('createdAt', 'asc')
);
const unsub = onSnapshot(q, (snap) => {
const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
setMeals(rows);
});
return () => unsub();
}, [user]);

const openAddMeal = (day, slot) => {
setPendingDay(day);
setPendingSlot(slot);
setIsOpen(true);
};

return (
<>
<div className="wrap">
<div className="repasHeader">
<div className="title">
<h2>Mes repas</h2>
<p className="muted">Planifie tes repas de la semaine</p>
</div>
<button className="primary" onClick={() => openAddMeal('Lundi','Déjeuner')}>Ajouter un repas</button>
</div>

<div className="mealPlanner">
{DAYS.map((day) => (
<div className="dayCard" key={day}>
<h3 className="dayTitle">{day}</h3>

<div className="slots">
{SLOTS.map((slot) => {
const items = meals.filter(m => m.day === day && m.slot === slot);
return (
<div className="slotCard" key={slot}>
<div>
<p className="slotName">{slot}</p>

{items.length === 0 ? (
<p className="slotPlaceholder">Aucun repas • <button className="slotAdd" onClick={() => openAddMeal(day, slot)}>+ Ajouter</button></p>
) : (
<div className="slotContent">
{items.map(m => (
<div key={m.id} style={{marginBottom: '6px'}}>
<strong>{m.name || 'Repas'}</strong>
{Array.isArray(m.products) && m.products.length > 0 && (
<ul>
{m.products.map(p => <li key={p.id || p}>{p.name || p}</li>)}
</ul>
)}
</div>
))}
<button className="slotAdd" onClick={() => openAddMeal(day, slot)}>+ Ajouter</button>
</div>
)}
</div>
</div>
);
})}
</div>
</div>
))}
</div>
</div>

{/* Tabbar */}
<nav className="tabbar" role="navigation" aria-label="Navigation principale">
<Link href="/fridge" className={`tab ${pathname?.startsWith('/fridge') ? 'is-active' : ''}`}>
<span className="tab_icon">🧊</span><span className="tab_label">Frigo</span>
</Link>
<Link href="/repas" className={`tab ${pathname?.startsWith('/repas') ? 'is-active' : ''}`}>
<span className="tab_icon">🍽️</span><span className="tab_label">Repas</span>
</Link>
<Link href="/settings" className={`tab ${pathname?.startsWith('/settings') ? 'is-active' : ''}`}>
<span className="tab_icon">⚙️</span><span className="tab_label">Paramètres</span>
</Link>
</nav>
</>
);
}
