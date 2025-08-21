'use client';

import React, { useEffect, useMemo, useState } from 'react';
import './repas.css';
import CreateMealModal from './CreateMealModal';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase/firebase-config';
import {
collection, getDocs, query, where, orderBy, deleteDoc, doc,
} from 'firebase/firestore';

const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const SLOTS = ['Déjeuner','Dîner'];

export default function MealsPage() {
const { user } = useAuth();
const [isHydrated, setIsHydrated] = useState(false);

const [meals, setMeals] = useState([]); // [{id, day, slot, name, products:[]}]
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');

const [open, setOpen] = useState(false);
const [defDay, setDefDay] = useState('Lundi');
const [defSlot, setDefSlot] = useState('Déjeuner');

useEffect(() => setIsHydrated(true), []);
const canUseFirestore = useMemo(() => !!user?.uid, [user?.uid]);

const loadMeals = async () => {
if (!canUseFirestore) { setMeals([]); return; }
setLoading(true); setError('');
try {
const q = query(
collection(db, 'users', user.uid, 'meals'),
orderBy('day'), orderBy('slot')
);
const snap = await getDocs(q);
const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
setMeals(list);
} catch (e) {
console.error(e);
setError("Impossible de charger les repas.");
setMeals([]);
} finally {
setLoading(false);
}
};

useEffect(() => { if (isHydrated) loadMeals(); }, [isHydrated, canUseFirestore]);

const grouped = useMemo(() => {
const by = {};
DAYS.forEach(d => { by[d] = { 'Déjeuner': [], 'Dîner': [] }; });
meals.forEach(m => {
const d = DAYS.includes(m.day) ? m.day : 'Lundi';
const s = SLOTS.includes(m.slot) ? m.slot : 'Déjeuner';
by[d][s].push(m);
});
return by;
}, [meals]);

const openAdd = (day, slot) => {
setDefDay(day); setDefSlot(slot); setOpen(true);
};

const handleSaved = (saved) => {
setMeals(prev => [{ id: saved.id, ...saved }, ...prev]);
};

const deleteMeal = async (mealId) => {
if (!canUseFirestore) return;
try {
await deleteDoc(doc(db, 'users', user.uid, 'meals', mealId));
} catch (e) {
console.error(e);
} finally {
setMeals(prev => prev.filter(m => m.id !== mealId));
}
};

if (!isHydrated) return null;

return (
<div className="meals_page">
<header className="meals_header">
<div className="meals_title">
<span className="emoji">🍽️</span>
<div>
<h1>Mes repas</h1>
<p>Planifie tes repas de la semaine</p>
</div>
</div>
<button className="btnPrimary" onClick={() => openAdd('Lundi','Déjeuner')}>+ Ajouter un repas</button>
</header>

{error && <div className="alert error">{error}</div>}
{loading && <div className="alert muted">Chargement…</div>}

<div className="week_grid">
{DAYS.map(day => (
<section key={day} className="day_card">
<h3 className="day_title">{day}</h3>

{SLOTS.map(slot => (
<div key={slot} className="slot_block">
<div className="slot_head">
<strong>{slot}</strong>
<button className="link_add" onClick={() => openAdd(day, slot)}>+ Ajouter</button>
</div>

<div className="slot_body">
{grouped[day][slot].length === 0 ? (
<div className="empty_slot">Aucun repas</div>
) : grouped[day][slot].map(meal => (
<div className="meal_item" key={meal.id}>
<div className="meal_row">
<div>
<div className="meal_name">{meal.name || '(sans nom)'}</div>
{Array.isArray(meal.products) && meal.products.length > 0 && (
<ul className="meal_products">
{meal.products.map(p => (
<li key={p.id || p}>{p.name || p}</li>
))}
</ul>
)}
</div>
<button className="btnDanger sm" onClick={() => deleteMeal(meal.id)}>Supprimer</button>
</div>
</div>
))}
</div>
</div>
))}
</section>
))}
</div>

{open && (
<CreateMealModal
open={open}
onClose={() => setOpen(false)}
defaultDay={defDay}
defaultSlot={defSlot}
user={user || null}
onSaved={(saved) => {
handleSaved(saved);
setOpen(false);
}}
/>
)}
</div>
);
}

