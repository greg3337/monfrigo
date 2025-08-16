'use client';

import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase/firebase-config';
import { collection, onSnapshot, query } from 'firebase/firestore';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import CreateMealModal from './CreateMealModal';

export default function RepasPage() {
const [userName, setUserName] = useState(''); // pour "Salut ..."
const [meals, setMeals] = useState([]); // (on l’affiche plus tard)
const [search, setSearch] = useState('');
const [isOpen, setIsOpen] = useState(false); // modale de composition
const pathname = usePathname();

// Auth + fetch repas + nom utilisateur
useEffect(() => {
let unsubMeals = null;
const unsubAuth = onAuthStateChanged(auth, async (u) => {
if (!u) {
setMeals([]);
setUserName('');
if (unsubMeals) unsubMeals();
return;
}
// nom dans le token ou displayName
setUserName(u.displayName || u.email?.split('@')[0] || 'utilisateur');

const q = query(collection(db, 'users', u.uid, 'meals'));
unsubMeals = onSnapshot(q, (snap) => {
const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
setMeals(list);
});
});
return () => {
if (unsubMeals) unsubMeals();
unsubAuth();
};
}, []);

// (facultatif) filtre sur le nom du repas ou les items
const visible = meals.filter((m) => {
const q = search.trim().toLowerCase();
if (!q) return true;
const inName = (m.name || '').toLowerCase().includes(q);
const inItems = Array.isArray(m.items)
? m.items.some((it) => (it.name || '').toLowerCase().includes(q))
: false;
return inName || inItems;
});

return (
<div className="page repasSimple">
{/* Header compact comme ta capture */}
<div className="repasHeader">
<div className="title">
<div className="titleLine">
<span className="cube">🧊</span>
<strong>Repas</strong>
</div>
<div className="hello">Salut {userName} 👋</div>
</div>

<div className="actions">
<input
className="search"
placeholder="Rechercher un repas ou un ingrédient…"
value={search}
onChange={(e) => setSearch(e.target.value)}
/>
<button className="primary" onClick={() => setIsOpen(true)}>
+ Composer un repas
</button>
</div>
</div>

{/* État vide centré (même vibe que ta capture) */}
{visible.length === 0 && (
<div className="emptyMeals">
<div className="emoji">🍲</div>
<div className="emptyTitle">Aucun repas pour l’instant</div>
<div className="emptyText">
Compose un repas à partir des produits de ton frigo.
</div>
<button className="primary" onClick={() => setIsOpen(true)}>
Composer un repas
</button>
</div>
)}

{/* (Quand tu voudras afficher la liste des repas, tu la poses ici) */}

{/* Modale de création (avec bloc produits bleu) */}
{isOpen && (
<CreateMealModal
selectedDay={null} // on ne planifie pas par jour ici
close={() => setIsOpen(false)}
/>
)}

{/* --- Tabbar --- */}
<nav className="tabbar" role="navigation" aria-label="Navigation principale">
<Link href="/fridge" className={`tab ${pathname.includes('/fridge') ? 'is-active' : ''}`}>
<span className="tab__icon">🧊</span>
<span className="tab__label">Frigo</span>
</Link>

<Link href="/repas" className={`tab ${pathname.includes('/repas') ? 'is-active' : ''}`}>
<span className="tab__icon">🍽️</span>
<span className="tab__label">Repas</span>
</Link>

<Link href="/settings" className={`tab ${pathname.includes('/settings') ? 'is-active' : ''}`}>
<span className="tab__icon">⚙️</span>
<span className="tab__label">Paramètres</span>
</Link>
</nav>
</div>
);
}
