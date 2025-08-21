'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { getAuth } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase-config';

import CreateMealModal from './CreateMealModal';
import './repas.css';

const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const SLOTS = ['Déjeuner','Dîner'];

export default function RepasPage() {
const pathname = usePathname();

const [meals, setMeals] = useState([]);
const [modalOpen, setModalOpen] = useState(false);
const [pendingDay, setPendingDay] = useState(null);
const [pendingSlot, setPendingSlot] = useState(null);

useEffect(() => {
const auth = getAuth();
const user = auth.currentUser;
if (!user) return;

const q = query(collection(db, 'meals'), where('userId', '==', user.uid));
const unsub = onSnapshot(q, (snap) => {
setMeals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
});

return () => unsub();
}, []);

const openAdd = (day, slot) => {
setPendingDay(day);
setPendingSlot(slot);
setModalOpen(true);
};

return (
<>
<div className="repasPage">
<h2>Mes repas</h2>
<p>Planifie tes repas de la semaine</p>

<div className="repasGrid">
{DAYS.map((day) => (
<div key={day} className="dayColumn">
<h3>{day}</h3>
{SLOTS.map((slot) => {
const list = meals.filter(m => m.day === day && m.slot === slot);
return (
<div key={slot} className="mealSlot">
<div className="slotHeader"><strong>{slot}</strong></div>

{list.length === 0 ? (
<p className="empty">
Aucun repas
<button className="linkBtn" onClick={() => openAdd(day, slot)}>+ Ajouter</button>
</p>
) : (
<ul className="mealList">
{list.map(m => (
<li key={m.id}>
<span className="mealName">{m.name || '(Sans nom)'}</span>
</li>
))}
<li>
<button className="linkBtn" onClick={() => openAdd(day, slot)}>+ Ajouter</button>
</li>
</ul>
)}
</div>
);
})}
</div>
))}
</div>

{modalOpen && (
<CreateMealModal
defaultDay={pendingDay}
defaultSlot={pendingSlot}
closeModal={() => setModalOpen(false)}
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
