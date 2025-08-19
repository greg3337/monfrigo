'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { db } from '../firebase/firebase-config';
import { collection, onSnapshot } from 'firebase/firestore';

import CreateMealModal from './CreateMealModal.jsx';
import './repas.css';

export default function RepasPage() {
const pathname = usePathname();

const [isOpen, setIsOpen] = useState(false);
const [pendingDay, setPendingDay] = useState(null);
const [pendingSlot, setPendingSlot] = useState(null);

const [meals, setMeals] = useState([]);

// Charger les repas existants
useEffect(() => {
const unsub = onSnapshot(collection(db, 'meals'), (snapshot) => {
const mealData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
setMeals(mealData);
});
return () => unsub();
}, []);

const openAddMeal = (day, slot) => {
setPendingDay(day);
setPendingSlot(slot);
setIsOpen(true);
};

// Grouper les repas par jour/slot
const getMealForSlot = (day, slot) => {
return meals.find((meal) => meal.day === day && meal.slot === slot);
};

return (
<>
<div className="repasSimple">
{/* ===== Header ===== */}
<div className="repasHeader">
<div className="title">
<div className="titleLine">
<span className="cube">🍽️</span>
<h2>Mes repas</h2>
</div>
<p className="hello">Planifie tes repas de la semaine</p>
</div>
<div className="actions">
<button className="btnPrimary" onClick={() => openAddMeal('Lundi', 'Déjeuner')}>
➕ Ajouter un repas
</button>
</div>
</div>

{/* ===== Planning ===== */}
<div className="mealPlanner">
{['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'].map((day, i) => (
<div key={i} className="dayCard">
<h3 className="dayTitle">{day}</h3>
<div className="slots">
{['Déjeuner','Dîner'].map((slot, j) => {
const meal = getMealForSlot(day, slot);
return (
<div key={j} className="slotCard" onClick={() => openAddMeal(day, slot)}>
<p className="slotName">{slot}</p>
{meal ? (
<p className="slotMeal">{meal.productName}</p>
) : (
<p className="slotPlaceholder">➕ Ajouter</p>
)}
</div>
);
})}
</div>
</div>
))}
</div>

{/* ===== Modal ===== */}
{isOpen && (
<CreateMealModal
closeModal={() => setIsOpen(false)}
defaultDay={pendingDay}
defaultSlot={pendingSlot}
/>
)}
</div>

{/* ===== Tabbar ===== */}
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
