'use client';

import React, { useEffect, useState } from 'react';
import './repas.css';
import CreateMealModal from './CreateMealModal';
import { useAuth } from '../hooks/useAuth'; // chemin selon ton projet (src/app/hooks/useAuth.tsx)

const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const SLOTS = ['Déjeuner','Dîner'];

export default function MealsPage() {
const { user } = useAuth(); // suppose que ça renvoie { user } ou null
const [open, setOpen] = useState(false);
const [defaultDay, setDefaultDay] = useState('Lundi');
const [defaultSlot, setDefaultSlot] = useState('Déjeuner');

// simple liste locale des repas (affichage). Tu peux la brancher sur Firestore ensuite.
const [meals, setMeals] = useState([]); // [{id, day, slot, name, products: [...] }]

// Pour éviter tout rendu serveur foireux, on attend le client
const [isHydrated, setIsHydrated] = useState(false);
useEffect(() => setIsHydrated(true), []);
if (!isHydrated) return null;

const handleAddClick = (day, slot) => {
setDefaultDay(day);
setDefaultSlot(slot);
setOpen(true);
};

const handleSaved = (newMeal) => {
// Ajout optimiste à l’écran
setMeals((m) => [{ id: newMeal.id || Math.random().toString(36).slice(2), ...newMeal }, ...m]);
};

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
<button
className="btnPrimary"
onClick={() => { setDefaultDay('Lundi'); setDefaultSlot('Déjeuner'); setOpen(true); }}
>
+ Ajouter un repas
</button>
</header>

<div className="week_grid">
{DAYS.map((day) => (
<section key={day} className="day_card">
<h3 className="day_title">{day}</h3>
{SLOTS.map((slot) => {
const items = meals.filter(m => m.day === day && m.slot === slot);
return (
<div key={day+slot} className="slot_block">
<div className="slot_head">
<strong>{slot}</strong>
<button className="link_add" onClick={() => handleAddClick(day, slot)}>+ Ajouter</button>
</div>
<div className="slot_body">
{items.length === 0 ? (
<div className="empty_slot">Aucun repas</div>
) : (
items.map(it => (
<div className="meal_item" key={it.id}>
<div className="meal_name">{it.name || '(sans nom)'}</div>
{Array.isArray(it.products) && it.products.length > 0 && (
<ul className="meal_products">
{it.products.map(p => <li key={p.id || p}>{p.name || p}</li>)}
</ul>
)}
</div>
))
)}
</div>
</div>
);
})}
</section>
))}
</div>

{open && (
<CreateMealModal
open={open}
onClose={() => setOpen(false)}
defaultDay={defaultDay}
defaultSlot={defaultSlot}
onSaved={(saved) => {
handleSaved(saved);
setOpen(false);
}}
user={user || null}
/>
)}
</div>
);
}
