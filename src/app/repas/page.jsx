'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase/firebase-config';
import {collection, onSnapshot, query, where, addDoc, deleteDoc, doc, updateDoc} from 'firebase/firestore';

import CreateMealModal from './CreateMealModal.jsx';
import '../styles/tabbar.css'; // ta tabbar
import './repas.css'; // style spécifique repas

const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const SLOTS = ['Petit-déjeuner', 'Déjeuner', 'Dîner', 'Goûter'];

function computeStatus(isoDate) {
if (!isoDate) return 'ok';
const today = new Date(); today.setHours(0,0,0,0);
const d = new Date(isoDate); d.setHours(0,0,0,0);
const diffDays = Math.ceil((d - today) / (1000*60*60*24));
if (diffDays < 0) return 'expired';
if (diffDays <= 2) return 'urgent';
return 'ok';
}

export default function RepasPage() {
const pathname = usePathname();
const [user, setUser] = useState(null);
const [meals, setMeals] = useState([]); // {id, day, slot, name, products: [{id,name,expirationDate,category,place}]}

// Modale
const [isOpen, setIsOpen] = useState(false);
const [pendingDay, setPendingDay] = useState(null);
const [pendingSlot, setPendingSlot] = useState(null);
const [editMeal, setEditMeal] = useState(null); // si défini => mode édition

useEffect(() => {
const unsub = onAuthStateChanged(auth, u => {
setUser(u || null);
if (!u) return;
const q = query(collection(db, 'users', u.uid, 'meals'));
const unsubMeals = onSnapshot(q, snap => {
const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
setMeals(list);
});
return () => unsubMeals();
});
return () => unsub();
}, []);

const openAddMeal = (day, slot) => {
setPendingDay(day);
setPendingSlot(slot);
setEditMeal(null);
setIsOpen(true);
};
const openEditMeal = (meal) => {
setEditMeal(meal);
setPendingDay(meal.day);
setPendingSlot(meal.slot);
setIsOpen(true);
};

// Suppression d'un repas + restauration des produits dans le frigo
const deleteMeal = async (meal) => {
if (!user) return;
try {
// 1) Restaurer les produits dans /products
const prods = Array.isArray(meal.products) ? meal.products : [];
for (const p of prods) {
const payload = {
name: p.name || 'Produit',
expirationDate: p.expirationDate || '',
category: p.category || 'autre',
place: p.place || 'frigo',
status: computeStatus(p.expirationDate || ''),
createdAt: new Date().toISOString(),
};
await addDoc(collection(db, 'users', user.uid, 'products'), payload);
}
// 2) Supprimer le repas
await deleteDoc(doc(db, 'users', user.uid, 'meals', meal.id));
} catch (e) {
console.error('deleteMeal error', e);
alert("Erreur lors de la suppression du repas.");
}
};

// Affichage : indexer par jour+slot
const byDaySlot = useMemo(() => {
const map = {};
meals.forEach(m => {
const k = `${m.day}__${m.slot}`;
map[k] = m;
});
return map;
}, [meals]);

return (
<>
<div className="repasSimple">
{/* ===== En-tête ===== */}
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
➕ Créer un repas
</button>
</div>
</div>

{/* ===== Planning hebdo ===== */}
<div className="planner">
{DAYS.map(day => (
<div key={day} className="dayBlock">
<div className="dayHead">
<span className="dayEmoji">🗓️</span>
<span className="dayTitle">{day}</span>
</div>

<div className="slots">
{SLOTS.map(slot => {
const k = `${day}__${slot}`;
const meal = byDaySlot[k];
return (
<div key={slot} className="mealItem">
<div className="mealInfo">
<div className="slotName">{slot}</div>
{!meal && <div className="emptyMeal">— Aucun repas planifié —</div>}
{meal && (
<div className="mealSummary">
<div className="mealName">{meal.name || 'Repas'}</div>
{Array.isArray(meal.products) && meal.products.length > 0 && (
<div className="mealProducts">
{meal.products.map(p => p.name).join(', ')}
</div>
)}
</div>
)}
</div>

<div className="mealActions">
{!meal ? (
<button className="btnPrimary" onClick={() => openAddMeal(day, slot)}>
+ Ajouter un repas
</button>
) : (
<>
<button className="btnGhost" onClick={() => openEditMeal(meal)}>
✏️ Modifier
</button>
<button className="btnDanger" onClick={() => deleteMeal(meal)}>
🗑️ Supprimer
</button>
</>
)}
</div>
</div>
);
})}
</div>
</div>
))}
</div>

{/* ===== Modale (création / édition) ===== */}
{isOpen && (
<CreateMealModal
closeModal={() => { setIsOpen(false); setEditMeal(null); }}
defaultDay={pendingDay}
defaultSlot={pendingSlot}
// ⚡ mode édition si editMeal non nul
editMeal={editMeal}
onSaved={() => { setIsOpen(false); setEditMeal(null); }}
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
