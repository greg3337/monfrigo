'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Modale
import CreateMealModal from './CreateMealModal.jsx';

// CSS de la page repas
import './repas.css';

// 🔹 Firebase
import { auth, db } from '../firebase/firebase-config';
import {
collection,
onSnapshot,
query,
} from 'firebase/firestore';

// Jours/slots affichés dans l’UI
const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const SLOTS = ['Déjeuner','Dîner'];

// Normalisations pour compatibilité de champs
function normalizeDay(d) {
if (!d) return '';
const map = {
lundi: 'Lundi', mardi: 'Mardi', mercredi: 'Mercredi', jeudi: 'Jeudi',
vendredi: 'Vendredi', samedi: 'Samedi', dimanche: 'Dimanche'
};
const key = d.toString().trim().toLowerCase();
return map[key] || d; // si déjà "Lundi" etc., on garde
}

function normalizeSlot(s, moment) {
// On accepte ancienne clé "moment" = midi/soir
const v = (s || moment || '').toString().trim().toLowerCase();
if (v === 'midi' || v === 'déjeuner' || v === 'dejeuner') return 'Déjeuner';
if (v === 'soir' || v === 'dîner' || v === 'diner') return 'Dîner';
return s || moment || '';
}

export default function RepasPage() {
const pathname = usePathname();

// États UI
const [isOpen, setIsOpen] = useState(false);
const [pendingDay, setPendingDay] = useState(null);
const [pendingSlot, setPendingSlot] = useState(null);

// Données repas (Firestore)
const [meals, setMeals] = useState([]);
const [user, setUser] = useState(null);

// Écoute auth + écoute temps réel des repas
useEffect(() => {
const unsubAuth = auth.onAuthStateChanged((u) => {
setUser(u || null);
if (!u) { setMeals([]); return; }

const q = query(collection(db, 'users', u.uid, 'meals'));
const unsubMeals = onSnapshot(q, (snap) => {
const list = snap.docs.map((d) => {
const data = d.data();
return {
id: d.id,
name: data.name || '',
// compat: day en FR capitalisé
day: normalizeDay(data.day || data.jour || ''),
// compat: slot/moment -> Déjeuner/Dîner
slot: normalizeSlot(data.slot, data.moment),
items: data.items || data.products || [], // compat: items vs products
...data,
};
});
setMeals(list);
});

// cleanup
return () => unsubMeals();
});

return () => unsubAuth();
}, []);

// Helper d’affichage : repas pour un jour + slot
const mealsByDaySlot = useMemo(() => {
const map = {}; // { 'Lundi|Déjeuner': [meal, ...] }
meals.forEach((m) => {
const key = `${normalizeDay(m.day)}|${normalizeSlot(m.slot, m.moment)}`;
if (!map[key]) map[key] = [];
map[key].push(m);
});
return map;
}, [meals]);

const getMealsFor = (day, slot) => mealsByDaySlot[`${day}|${slot}`] || [];

// Ouvrir la modale pour un jour + créneau
const openAddMeal = (day, slot) => {
setPendingDay(day);
setPendingSlot(slot);
setIsOpen(true);
};

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
<p className="hello">
{user ? `Salut ${user.displayName || user.email?.split('@')[0] || 'utilisateur'} 👋`
: 'Connecte-toi pour planifier tes repas'}
</p>
</div>
<div className="actions">
<button
className="primary"
onClick={() => openAddMeal('Lundi', 'Déjeuner')}
disabled={!user}
>
➕ Ajouter un repas
</button>
</div>
</div>

{/* ===== Planning hebdo ===== */}
{DAYS.map((day) => (
<div key={day} className="dayCard">
<h3 className="dayTitle">{day}</h3>
{SLOTS.map((slot) => {
const list = getMealsFor(day, slot);
const summary = list.map((m) => m.name).join(', ');
return (
<div
key={slot}
className="mealItem"
onClick={() => user && openAddMeal(day, slot)}
title={user ? 'Ajouter / modifier un repas' : 'Connecte-toi pour ajouter un repas'}
>
<div className="slot">{slot}</div>

{list.length === 0 ? (
<div className="emptyMeal">Aucun repas planifié</div>
) : (
<div className="products">{summary}</div>
)}

<button
type="button"
onClick={(e) => {
e.stopPropagation();
if (user) openAddMeal(day, slot);
}}
disabled={!user}
>
+ Ajouter un repas
</button>
</div>
);
})}
</div>
))}

{/* ===== Modale ===== */}
{isOpen && (
<CreateMealModal
closeModal={() => setIsOpen(false)}
defaultDay={pendingDay} // ex: "Lundi"
defaultSlot={pendingSlot} // ex: "Déjeuner"
/>
)}
</div>

{/* ===== Tabbar en bas ===== */}

<nav className="tabbar" role="navigation" aria-label="Navigation principale">
<Link href="/fridge" className={`tab ${pathname?.startsWith('/frigo') ? 'is-active' : ''}`}>
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
