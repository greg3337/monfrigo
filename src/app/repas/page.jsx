'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import CreateMealModal from './CreateMealModal.jsx';
import '../styles/tabbar.css'; // si tu as déjà la tabbar, garde cet import

import { auth } from '../firebase/firebase-config'; // <- chemin depuis /repas/
import './repas.css'; // ton CSS de la page si tu en as un

const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const SLOTS = ['Déjeuner','Dîner'];

export default function RepasPage() {
const pathname = usePathname();
const [showModal, setShowModal] = useState(false);
const [selectedDay, setSelectedDay] = useState(DAYS[0]);
const [selectedSlot, setSelectedSlot] = useState(SLOTS[0]);

const userId = auth?.currentUser?.uid || null;

const openModal = (day, slot) => {
setSelectedDay(day);
setSelectedSlot(slot);
setShowModal(true);
};

return (
<>
<div className="wrap">
<header className="header" style={{marginBottom: 16}}>
<div className="brandTitle">
<span role="img" aria-label="plate">🍽️</span> Mes repas
</div>
<div className="brandSub">Planifie tes repas de la semaine</div>
<button
className="primary"
style={{marginLeft:'auto'}}
onClick={() => openModal(DAYS[0], SLOTS[0])}
>
+ Ajouter un repas
</button>
</header>

{/* Planning hebdo */}
<div className="grid" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
{DAYS.map(day => (
<section key={day} className="dayCard" style={{background:'#fff', border:'1px dashed #ddd', borderRadius:12, padding:12}}>
<h3 style={{margin:'4px 0 8px 0'}}>{day}</h3>
{SLOTS.map(slot => (
<div key={slot} style={{borderTop:'1px dashed #eee', paddingTop:10, marginTop:10}}>
<div style={{fontWeight:600, fontSize:13, color:'#666'}}>{slot}</div>
<button
className="btnGhost"
onClick={() => openModal(day, slot)}
>
+ Ajouter
</button>
</div>
))}
</section>
))}
</div>
</div>

{/* Modale */}
{showModal && (
<CreateMealModal
onClose={() => setShowModal(false)}
defaultDay={selectedDay}
defaultSlot={selectedSlot}
userId={userId}
/>
)}

{/* Tabbar en bas */}
<nav className="tabbar" role="navigation" aria-label="Navigation principale">
<Link href="/fridge" className={`tab ${pathname?.startsWith('/fridge') ? 'is-active' : ''}`}>
<span className="tab_icon">🧊</span><span className="tab_label">Frigo</span>
</Link>
<Link href="/repas" className={`tab ${pathname?.startsWith('/repas') ? 'is-active' : ''}`}>
<span className="tab_icon">🍽️</span><span className="tab_label">Repas</span>
</Link>
<Link href="/settings" className={`tab ${pathname?.startsWith('/settings') ? 'is-active' : ''}`}>
<span className="tab_icon">⚙️</span><span className="tab_label">Paramètres</span>
</Link>
</nav>
</>
);
}
