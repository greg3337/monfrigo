'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
onAuthStateChanged
} from 'firebase/auth';
import {
collection, query, where, onSnapshot, addDoc, doc, deleteDoc, serverTimestamp
} from 'firebase/firestore';

import { auth, db } from '../firebase/firebase-config';
import CreateMealModal from './CreateMealModal.jsx';
import './repas.css';

// Libellés en FR
const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const SLOTS = ['Petit-déjeuner','Déjeuner','Dîner','Goûter'];

export default function RepasPage() {
const pathname = usePathname();

const [user, setUser] = useState(null);
const [meals, setMeals] = useState([]); // liste brute Firestore
const [isOpen, setIsOpen] = useState(false);
const [pendingDay, setPendingDay] = useState(null);
const [pendingSlot, setPendingSlot] = useState(null);

// Auth
useEffect(() => {
const unsub = onAuthStateChanged(auth, u => setUser(u || null));
return () => unsub();
}, []);

// Stream des repas de l’utilisateur
useEffect(() => {
if (!user) return;
const qMeals = query(
collection(db, 'users', user.uid, 'meals'),
where('userId', '==', user.uid)
);
const unsub = onSnapshot(qMeals, snap => {
const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
setMeals(rows);
});
return () => unsub();
}, [user]);

// Regroupement par (jour, créneau)
const grouped = useMemo(() => {
const map = {};
for (const d of DAYS) {
map[d] = {};
for (const s of SLOTS) map[d][s] = [];
}
meals.forEach(m => {
const d = m.day || 'Lundi';
const s = m.slot || 'Déjeuner';
if (!map[d]) map[d] = {};
if (!map[d][s]) map[d][s] = [];
map[d][s].push(m);
});
return map;
}, [meals]);

// Ouvrir la modale “Ajouter un repas”
const openAddMeal = (day, slot) => {
setPendingDay(day);
setPendingSlot(slot);
setIsOpen(true);
};

// Supprimer un repas
const handleDeleteMeal = async (mealId) => {
if (!user) return;
try {
await deleteDoc(doc(db, 'users', user.uid, 'meals', mealId));
} catch (e) {
console.error('delete meal error', e);
alert("Impossible de supprimer ce repas.");
}
};

// Création d’un repas (callback depuis la modale)
const handleCreateMeal = async ({ name, day, slot, product }) => {
if (!user) return;

try {
// 1) créer le repas
await addDoc(collection(db, 'users', user.uid, 'meals'), {
userId: user.uid,
name: name || 'Repas',
day,
slot,
products: product ? [{ id: product.id, name: product.name }] : [],
createdAt: serverTimestamp()
});

// 2) supprimer le produit du frigo s’il existe
if (product?.id) {
await deleteDoc(doc(db, 'users', user.uid, 'products', product.id));
}

setIsOpen(false);
} catch (e) {
console.error('create meal error', e);
alert("Impossible d’enregistrer le repas.");
}
};

return (
<>
<div className="repasWrap">
{/* Header */}
<div className="repasHeader">
<div className="title">
<div className="titleLine">
<span className="cube" aria-hidden>🍽️</span>
<h2>Mes repas</h2>
</div>
<p className="hello">Planifie tes repas et vide ton frigo intelligemment</p>
</div>
<div className="actions">
<button
className="btnPrimary"
onClick={() => openAddMeal('Lundi', 'Déjeuner')}
>
➕ Créer un repas
</button>
</div>
</div>

{/* Planning semaine */}
<div className="week">
{DAYS.map((day) => (
<section key={day} className="dayCard">
<h3 className="dayTitle">{day}</h3>

{SLOTS.map((slot) => (
<div key={slot} className="mealItem">
<div className="left">
<div className="slot">{slot}</div>
<div className="products">
{grouped[day][slot].length === 0 ? (
<span className="emptyMeal">Aucun repas planifié</span>
) : (
grouped[day][slot].map(m => (
<span key={m.id} className="chip">
{m.name}
<button
className="chip_remove"
title="Supprimer ce repas"
onClick={() => handleDeleteMeal(m.id)}
>
×
</button>
</span>
))
)}
</div>
</div>

<button className="btnGhost" onClick={() => openAddMeal(day, slot)}>
+ Ajouter un repas
</button>
</div>
))}
</section>
))}
</div>
</div>

{/* Modale */}
{isOpen && (
<CreateMealModal
defaultDay={pendingDay}
defaultSlot={pendingSlot}
onCancel={() => setIsOpen(false)}
onCreate={handleCreateMeal}
/>
)}

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
