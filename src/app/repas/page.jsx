'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import CreateMealModal from './CreateMealModal.jsx';
import './repas.css';

const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const SLOTS = ['Déjeuner','Dîner'];

export default function RepasPage() {
const pathname = usePathname();

const [showModal, setShowModal] = useState(false);
const [pendingDay, setPendingDay] = useState('Lundi');
const [pendingSlot, setPendingSlot] = useState('Déjeuner');

const openAdd = (day, slot) => {
setPendingDay(day);
setPendingSlot(slot);
setShowModal(true);
};

const closeModal = () => setShowModal(false);

return (
<>
<div className="repasPage">
<header className="repasHeader">
<div className="title">
<div className="titleLine">
<span className="cube" aria-hidden>🍽️</span>
<h2>Mes repas</h2>
</div>
<p className="hello">Planifie tes repas de la semaine</p>
</div>
<button className="btnPrimary" type="button" onClick={() => openAdd('Lundi','Déjeuner')}>
➕ Ajouter un repas
</button>
</header>

{/* Grille semaine (même structure visuelle) */}
<div className="weekGrid">
{DAYS.map((day) => (
<section key={day} className="dayCard">
<h3 className="dayTitle">{day}</h3>
<div className="slots">
{SLOTS.map((slot) => (
<div key={slot} className="slotCard">
<p className="slotName">{slot}</p>
<button type="button" className="addBtn" onClick={() => openAdd(day, slot)}>
+ Ajouter
</button>
</div>
))}
</div>
</section>
))}
</div>
</div>

{/* Modale */}
{showModal && (
<div className="modalOverlay" onClick={closeModal}>
<div className="modal" onClick={(e) => e.stopPropagation()}>
<CreateMealModal
defaultDay={pendingDay}
defaultSlot={pendingSlot}
onClose={closeModal}
/>
</div>
</div>
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
