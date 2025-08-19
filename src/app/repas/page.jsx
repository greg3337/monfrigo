'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { onAuthStateChanged } from 'firebase/auth';
import {collection,onSnapshot,query,doc,deleteDoc,addDoc,} from 'firebase/firestore';

import { auth, db } from '../firebase/firebase-config';
import CreateMealModal from './CreateMealModal.jsx'; // ta modale existante

// Libellés d’affichage
const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const SLOTS = ['Petit-déjeuner', 'Déjeuner', 'Dîner', 'Goûter'];

export default function RepasPage() {
const pathname = usePathname();

const [user, setUser] = useState(null);
const [meals, setMeals] = useState([]); // [{id, day, slot, name, products?}]
const [isOpen, setIsOpen] = useState(false);
const [pendingDay, setPendingDay] = useState(null);
const [pendingSlot, setPendingSlot] = useState(null);

// Auth + abonnement aux repas
useEffect(() => {
const unSubAuth = onAuthStateChanged(auth, (u) => {
setUser(u || null);
if (!u) {
setMeals([]);
return;
}
const q = query(collection(db, 'users', u.uid, 'meals'));
const unSubMeals = onSnapshot(q, (snap) => {
const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
setMeals(list);
});
return () => unSubMeals();
});
return () => unSubAuth();
}, []);

// Indexation (jour/slot -> repas)
const mealsByDaySlot = useMemo(() => {
const map = {};
for (const m of meals) {
const day = m.day || m.jour || m.Day || '';
const slot = m.slot || m.creneau || m.time || '';
if (!map[day]) map[day] = {};
map[day][slot] = m;
}
return map;
}, [meals]);

// Ouvrir la modale pour créer un repas
const openAddMeal = (day, slot) => {
setPendingDay(day);
setPendingSlot(slot);
setIsOpen(true);
};

// Supprimer un repas + remettre les produits dans le frigo si on les connaît
const handleDeleteMeal = async (meal) => {
if (!user || !meal?.id) return;
try {
// 1) supprimer le repas
await deleteDoc(doc(db, 'users', user.uid, 'meals', meal.id));

// 2) remettre les produits (selon le schéma trouvé dans le repas)
// - soit meal.products: [{name, expirationDate, category, place}]
// - soit (ancien) meal.productId + meal.productName
if (Array.isArray(meal.products) && meal.products.length) {
const colRef = collection(db, 'users', user.uid, 'products');
for (const p of meal.products) {
await addDoc(colRef, {
name: p.name || 'Produit',
expirationDate: p.expirationDate || null,
category: p.category || 'autre',
place: p.place || 'fridge',
createdAt: new Date(),
});
}
} else if (meal.productName) {
await addDoc(collection(db, 'users', user.uid, 'products'), {
name: meal.productName,
createdAt: new Date(),
});
}

// Optionnel: petit feedback console
console.log('Repas supprimé, produits remis dans le frigo (si disponibles).');
} catch (e) {
console.error('Erreur suppression repas :', e);
}
};

return (
<>
{/* En-tête simple */}
<div style={{ padding: 16 }}>
<h2 style={{ margin: 0 }}>🍽️ Mes repas</h2>
<p style={{ opacity: 0.75, marginTop: 6 }}>
Salut {user?.email || 'utilisateur'} 👋
</p>
</div>

{/* Tableau “semaine” minimaliste */}
<div style={{ padding: '0 16px 90px 16px' }}>
{DAYS.map((day) => (
<div key={day} style={{ marginBottom: 18 }}>
<div
style={{
display: 'flex',
alignItems: 'center',
justifyContent: 'space-between',
padding: '8px 12px',
fontWeight: 700,
background: '#f6f7fb',
borderRadius: 8,
border: '1px solid #eee',
}}
>
<span>{day}</span>
<button
className="primary"
onClick={() => openAddMeal(day, 'Déjeuner')}
>
+ Créer un repas
</button>
</div>

<ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
{SLOTS.map((slot) => {
const meal = mealsByDaySlot[day]?.[slot];
return (
<li
key={slot}
style={{
display: 'flex',
alignItems: 'center',
justifyContent: 'space-between',
borderBottom: '1px solid #eee',
padding: '10px 12px',
}}
>
<div style={{ opacity: 0.75 }}>{slot}</div>

<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
{meal ? (
<>
<span>{meal.name || 'Repas'}</span>
<button
onClick={() => handleDeleteMeal(meal)}
style={{
background: '#dc3545',
color: '#fff',
border: 'none',
padding: '6px 10px',
borderRadius: 6,
cursor: 'pointer',
}}
title="Supprimer ce repas"
>
Supprimer
</button>
</>
) : (
<span style={{ opacity: 0.6 }}>Aucun repas planifié</span>
)}

<button
className="primary"
onClick={() => openAddMeal(day, slot)}
title="Ajouter / modifier un repas"
>
+ Ajouter un repas
</button>
</div>
</li>
);
})}
</ul>
</div>
))}
</div>

{/* Modale de création */}
{isOpen && (
<CreateMealModal
closeModal={() => setIsOpen(false)}
defaultDay={pendingDay}
defaultSlot={pendingSlot}
/>
)}

{/* Tabbar bas */}
<nav className="tabbar" role="navigation" aria-label="Navigation principale">
<Link
href="/fridge"
className={`tab ${pathname?.startsWith('/fridge') ? 'is-active' : ''}`}
>
<span className="tab_icon">🧊</span>
<span className="tab_label">Frigo</span>
</Link>
<Link
href="/repas"
className={`tab ${pathname?.startsWith('/repas') ? 'is-active' : ''}`}
>
<span className="tab_icon">🍽️</span>
<span className="tab_label">Repas</span>
</Link>
<Link
href="/settings"
className={`tab ${pathname?.startsWith('/settings') ? 'is-active' : ''}`}
>
<span className="tab_icon">⚙️</span>
<span className="tab_label">Paramètres</span>
</Link>
</nav>
</>
);
}
