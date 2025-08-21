'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Modale d’ajout
import CreateMealModal from './CreateMealModal.jsx';
// Styles
import './repas.css';

const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const SLOTS = ['Déjeuner','Dîner'];

export default function RepasPage() {
const pathname = usePathname();

// ⬇️ États pour la modale
const [showModal, setShowModal] = useState(false);
const [selectedDay, setDay] = useState('Lundi');
const [selectedSlot, setSlot] = useState('Déjeuner');

const openModal = (day, slot) => {
setDay(day);
setSlot(slot);
setShowModal(true);
};

return (
<>
<div className="repasPage">
<header className="repasHeader">
<div>
<h1>🍽️ Mes repas</h1>
<p>Planifie tes repas de la semaine</p>
</div>
<button
type="button"
className="btnPrimary"
onClick={() => openModal('Lundi', 'Déjeuner')}
>
➕ Ajouter un repas
</button>
</header>

{/* Grille hebdo */}
<div className="mealGrid">
{DAYS.map((day) => (
<section key={day} className="dayCard">
<h3 className="dayTitle">{day}</h3>

{SLOTS.map((slot) => (
<div key={slot} className="slotCard">
<div className="slotHeader">
<span className="slotName">{slot}</span>
<button
type="button"
className="addBtn"
onClick={() => openModal(day, slot)}
aria-label={`Ajouter un repas pour ${day} - ${slot}`}
>
+ Ajouter
</button>
</div>

{/* Ici tu affiches les repas existants pour ce créneau si tu en as */}
<p className="slotEmpty">Aucun repas</p>
</div>
))}
</section>
))}
</div>

{/* Modale */}
{showModal && (
<CreateMealModal
closeModal={() => setShowModal(false)}
defaultDay={selectedDay}
defaultSlot={selectedSlot}
/>
)}
</div>

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
