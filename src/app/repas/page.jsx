'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import CreateMealModal from './CreateMealModal';
import './repas.css';

const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const SLOTS = ['Déjeuner','Dîner'];

export default function RepasPage() {
const pathname = usePathname();
const [open, setOpen] = useState(false);
const [pending, setPending] = useState({ day: 'Lundi', slot: 'Déjeuner' });

const add = (day, slot) => { setPending({ day, slot }); setOpen(true); };

return (
<>
<div className="repasSimple">
<div className="repasHeader">
<div className="title">
<div className="titleLine">
<span className="cube">🍽️</span>
<h2>Mes repas</h2>
</div>
<p className="hello">Planifie tes repas de la semaine</p>
</div>
<div className="actions">
<button className="btnPrimary" onClick={()=>add('Lundi','Déjeuner')}>➕ Ajouter un repas</button>
</div>
</div>

<div className="mealPlanner">
{DAYS.map((d) => (
<div key={d} className="dayCard">
<h3 className="dayTitle">{d}</h3>
<div className="slots">
{SLOTS.map(s => (
<div key={s} className="slotCard">
<p className="slotName">{s}</p>
<p className="slotPlaceholder">
<button className="linkAdd" onClick={()=>add(d, s)}>+ Ajouter</button>
</p>
</div>
))}
</div>
</div>
))}
</div>

{open && (
<CreateMealModal
defaultDay={pending.day}
defaultSlot={pending.slot}
onClose={()=>setOpen(false)}
onSaved={()=>setOpen(false)}
/>
)}
</div>

{/* Tabbar */}
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
