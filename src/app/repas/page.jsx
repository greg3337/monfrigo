'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import CreateMealModal from './CreateMealModal.jsx';
import '../styles/tabbar.css'; // si tu as déjà ce fichier pour la tabbar
import './repas.css'; // ton css repas

const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const SLOTS = ['Déjeuner','Dîner'];

export default function RepasPage() {
const pathname = usePathname();

const [showModal, setShowModal] = useState(false);
const [currentDay, setCurrentDay] = useState('');
const [currentSlot, setCurrentSlot] = useState('');

const openAdd = (day, slot) => {
setCurrentDay(day);
setCurrentSlot(slot);
setShowModal(true);
};

return (
<>
<div className="wrap">
<header className="repasHeader">
<div className="title">
<div className="titleLine">
<span className="cube">🍽️</span>
<h2>Mes repas</h2>
</div>
<p className="hello">Planifie tes repas de la semaine</p>
</div>

<div className="actions">
<button
type="button"
className="btnPrimary"
onClick={() => openAdd('Lundi', 'Déjeuner')}
>
➕ Ajouter un repas
</button>
</div>
</header>

{/* Grille semaine (même structure visuelle) */}
<div className="mealPlanner">
{DAYS.map((day) => (
<section key={day} className="dayCard">
<h3 className="dayTitle">{day}</h3>
<div className="slots">
{SLOTS.map((slot) => (
<div key={slot} className="slotCard">
<p className="slotName">{slot}</p>
<button
type="button"
className="addBtn"
onClick={() => openAdd(day, slot)}
>
+ Ajouter
</button>
</div>
))}
</div>
</section>
))}
</div>
</div>

{/* Modale pour ajouter un repas */}
{showModal && (
<div className="modalOverlay" onClick={() => setShowModal(false)}>
<div className="modal" onClick={(e) => e.stopPropagation()}>
<CreateMealModal
dayLabel={currentDay}
slotLabel={currentSlot}
onClose={() => setShowModal(false)}
onSaved={() => setShowModal(false)}
/>
</div>
</div>
)}

{/* Tabbar en bas */}
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
