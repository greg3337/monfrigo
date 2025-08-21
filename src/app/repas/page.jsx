'use client';

import React, { useEffect, useState } from 'react';
import './repas.css';
import '../styles/tabbar.css';
import { db } from '../firebase/firebase-config';
import {
collection,
query,
where,
getDocs,
deleteDoc,
doc,
} from 'firebase/firestore';
import CreateMealModal from './CreateMealModal';
import useAuth from '../hooks/useAuth';

const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const SLOTS = ['Déjeuner','Dîner'];

export default function MealsPage() {
const { user } = useAuth();
const [meals, setMeals] = useState([]); // {id, day, slot, name, products:[]}
const [loading, setLoading] = useState(true);
const [showModal, setShowModal] = useState(false);
const [preset, setPreset] = useState({ day: 'Lundi', slot: 'Déjeuner' });

// Charger les repas de l’utilisateur
async function loadMeals() {
if (!user) return;
setLoading(true);
const q = query(collection(db, 'users', user.uid, 'meals'));
const snap = await getDocs(q);
const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
setMeals(data);
setLoading(false);
}

useEffect(() => { if (user) loadMeals(); }, [user]);

function openAdd(day, slot) {
setPreset({ day, slot });
setShowModal(true);
}

async function handleDelete(mealId) {
if (!user) return;
await deleteDoc(doc(db, 'users', user.uid, 'meals', mealId));
await loadMeals();
}

function mealsOf(day, slot) {
return meals.filter(m => m.day === day && m.slot === slot);
}

return (
<div className="meals_page">
<header className="meals_header">
<div>
<h1>🍽️ Mes repas</h1>
<p>Planifie tes repas de la semaine</p>
</div>
<button className="btnPrimary" onClick={() => openAdd('Lundi','Déjeuner')}>
+ Ajouter un repas
</button>
</header>

{loading ? (
<p>Chargement…</p>
) : (
<div className="week_grid">
{DAYS.map((day) => (
<div key={day} className="day_card">
<h3>{day}</h3>

{SLOTS.map((slot) => (
<div key={slot} className="slot_box">
<div className="slot_head">
<span className="slot_title">{slot}</span>
<button className="link_add" onClick={() => openAdd(day, slot)}>+ Ajouter</button>
</div>

<div className="slot_meals">
{mealsOf(day, slot).length === 0 && (
<div className="empty">Aucun repas</div>
)}
{mealsOf(day, slot).map((m) => (
<div key={m.id} className="meal_item">
<div className="meal_title">{m.name || '(sans nom)'}</div>
{Array.isArray(m.products) && m.products.length > 0 && (
<ul className="meal_products">
{m.products.map(p => (
<li key={p.id}>{p.name}</li>
))}
</ul>
)}
<button className="btnDanger small" onClick={() => handleDelete(m.id)}>
Supprimer
</button>
</div>
))}
</div>
</div>
))}
</div>
))}
</div>
)}

{showModal && (
<CreateMealModal
defaultDay={preset.day}
defaultSlot={preset.slot}
onClose={() => setShowModal(false)}
onSaved={() => { setShowModal(false); loadMeals(); }}
/>
)}

{/* Tabbar bas de page */}
<nav className="tabbar">
<a className="tab" href="/fridge">
<span className="tab_icon">🧊</span>
<span className="tab_label">Frigo</span>
</a>
<a className="tab is-active" href="/repas">
<span className="tab_icon">🍽️</span>
<span className="tab_label">Repas</span>
</a>
<a className="tab" href="/settings">
<span className="tab_icon">⚙️</span>
<span className="tab_label">Paramètres</span>
</a>
</nav>
</div>
);
}
